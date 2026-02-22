import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import * as speakeasy from 'speakeasy'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()

    const { code } = await req.json().catch(() => ({}))
    if (!code) return NextResponse.json({ error: 'Verification code required.' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    if (!user.twoFaEnabled || !user.twoFaSecret) {
      return NextResponse.json({ error: '2FA is not enabled.' }, { status: 400 })
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFaSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    })

    if (!verified) return NextResponse.json({ error: 'Invalid code. Check your authenticator app.' }, { status: 400 })

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFaEnabled: false, twoFaSecret: null },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
