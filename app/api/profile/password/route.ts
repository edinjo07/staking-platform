import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
})

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.password)
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })

    // Reject if new password is the same as the current one
    const isSame = await bcrypt.compare(parsed.data.newPassword, user.password)
    if (isSame) {
      return NextResponse.json({ error: 'New password must be different from your current password.' }, { status: 400 })
    }

    const hash = await bcrypt.hash(parsed.data.newPassword, 12)
    await prisma.user.update({ where: { id: user.id }, data: { password: hash } })

    return NextResponse.json({ message: 'Password changed.' })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
