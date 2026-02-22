import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import * as speakeasy from 'speakeasy'
import QRCode from 'qrcode'

export async function POST() {
  try {
    const session = await requireAuth()

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    // Don't overwrite an already-confirmed 2FA secret
    if (user.twoFaEnabled) {
      return NextResponse.json({ error: '2FA is already enabled. Disable it first.' }, { status: 400 })
    }

    const secret = speakeasy.generateSecret({ name: `StakePlatform (${user.email})`, length: 32 })

    // Store temp secret until confirmed
    await prisma.user.update({ where: { id: user.id }, data: { twoFaSecret: secret.base32 } })

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

    return NextResponse.json({ data: { qrCode: qrCodeUrl, secret: secret.base32 } })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
