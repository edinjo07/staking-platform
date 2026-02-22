import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/mail'

export async function POST(req: NextRequest) {
  await requireAdmin()

  const { target, subject, body } = await req.json()
  if (!subject?.trim() || !body?.trim()) return NextResponse.json({ error: 'Subject and body required.' }, { status: 400 })

  let where: any = {}
  if (target === 'active') where = { isActive: true }
  else if (target === 'verified') where = { emailVerified: { not: null } }

  const users = await prisma.user.findMany({ where, select: { email: true, firstName: true, lastName: true } })

  let count = 0
  for (const user of users) {
    try {
      await sendEmail({ to: user.email, subject, html: `<p>Hi ${user.firstName},</p>${body}` })
      count++
    } catch {}
  }

  return NextResponse.json({ count })
}
