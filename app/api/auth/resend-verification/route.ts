import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/mail'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const schema = z.object({ email: z.string().email() })

// POST /api/auth/resend-verification
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    })

    // Always return 200 to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'If that email exists, a verification link has been sent.' })
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email is already verified.' })
    }

    // Rate-limit: don't resend if a non-expired token was sent in the last 5 minutes
    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires > new Date(Date.now() - 24 * 60 * 60 * 1000 + 5 * 60 * 1000)
    ) {
      return NextResponse.json({ message: 'If that email exists, a verification link has been sent.' })
    }

    const token   = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: token, emailVerificationExpires: expires },
    })

    sendVerificationEmail(
      user.email,
      user.firstName || user.email,
      token
    ).catch(console.error)

    return NextResponse.json({ message: 'If that email exists, a verification link has been sent.' })
  } catch (err) {
    console.error('[resend-verification]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
