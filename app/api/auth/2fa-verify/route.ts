import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, buildNonce } from '@/lib/auth'
import { prisma } from '@/lib/db'
import * as speakeasy from 'speakeasy'

// POST /api/auth/2fa-verify
// Called from the login 2FA step with { code }.
// Requires a valid twoFaPending session (JWT has twoFaPending: true).
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Must have a pending 2FA session
    if (!(session as any)?.twoFaPending || !(session as any)?.twoFaUserId) {
      return NextResponse.json({ error: 'No pending 2FA session.' }, { status: 400 })
    }

    const userId = (session as any).twoFaUserId as string

    const { code } = await req.json()
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'TOTP code is required.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.twoFaEnabled || !user.twoFaSecret) {
      return NextResponse.json({ error: 'User not found or 2FA not configured.' }, { status: 400 })
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFaSecret,
      encoding: 'base32',
      token: code.replace(/\s/g, ''),
      window: 1, // allow ±30 s clock drift
    })

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired code. Try again.' }, { status: 400 })
    }

    // Build a server-signed nonce so the two-factor provider can trust the userId
    const nonce = await buildNonce(userId)

    return NextResponse.json({ userId, nonce })
  } catch (err) {
    console.error('[2fa-verify]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
