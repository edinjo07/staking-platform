import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import * as speakeasy from 'speakeasy'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()

    const { code } = await req.json()
    if (!code) return NextResponse.json({ error: 'Token required.' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user || !user.twoFaSecret) return NextResponse.json({ error: 'Setup 2FA first.' }, { status: 400 })

    const verified = speakeasy.totp.verify({
      secret: user.twoFaSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    })

    if (!verified) return NextResponse.json({ error: 'Invalid code.' }, { status: 400 })

    await prisma.user.update({ where: { id: user.id }, data: { twoFaEnabled: true } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
