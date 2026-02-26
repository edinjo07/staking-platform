import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { sendVerificationEmail } from '@/lib/mail'
import { generateReferralCode } from '@/lib/utils'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  // min(1) rejects empty strings — undefined/absent is still fine
  username: z.string().min(1).optional(),
  referralCode: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const { email, password, firstName, lastName, username, referralCode } = parsed.data

    // Check existing
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use.' }, { status: 409 })
    }

    let referredById: string | null = null
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } })
      if (referrer) referredById = referrer.id
    }

    const hash = await bcrypt.hash(password, 12)

    // Auto-generate a unique username if not supplied
    const baseUsername = username
      || (firstName ? firstName.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 9000 + 1000) : null)
      || 'user' + Math.floor(Math.random() * 900000 + 100000)
    let finalUsername = baseUsername
    let uAttempts = 0
    while (uAttempts < 10) {
      const taken = await prisma.user.findUnique({ where: { username: finalUsername } })
      if (!taken) break
      finalUsername = baseUsername + Math.floor(Math.random() * 9000 + 1000)
      uAttempts++
    }

    // Generate a unique referral code with collision retry
    let myReferralCode = generateReferralCode()
    let attempts = 0
    while (attempts < 5) {
      const exists = await prisma.user.findUnique({ where: { referralCode: myReferralCode } })
      if (!exists) break
      myReferralCode = generateReferralCode()
      attempts++
    }

    let user
    try {
      const verificationToken   = randomBytes(32).toString('hex')
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 h

      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hash,
          firstName: firstName ?? null,
          lastName: lastName ?? null,
          username: finalUsername,
          referralCode: myReferralCode,
          referredById,
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires,
        },
      })

      // Send verification email (non-blocking)
      sendVerificationEmail(user.email, firstName || user.email, verificationToken).catch(console.error)
    } catch (createError: any) {
      // P2002 = unique constraint violation (race condition on email)
      if (createError?.code === 'P2002') {
        return NextResponse.json({ error: 'Email already in use.' }, { status: 409 })
      }
      throw createError
    }

    return NextResponse.json({ message: 'Account created. Please check your email to verify your account.', userId: user.id }, { status: 201 })
  } catch (error) {
    console.error('[REGISTER]', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
