import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  token: z.string(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }
    const { token, password } = parsed.data

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 })
    }

    // Banned/suspended accounts cannot reset their password
    if (!user.isActive || user.bannedAt) {
      return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    })

    return NextResponse.json({ message: 'Password reset successfully.' })
  } catch (error) {
    console.error('[RESET_PASSWORD]', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
