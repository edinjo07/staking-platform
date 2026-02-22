import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName:  z.string().min(1).max(50).optional(),
  // min(1) rejects empty string; unique field
  username:  z.string().min(1).max(30).optional(),
})

export async function GET() {
  try {
    const session = await requireAuth()
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        username: true, avatar: true, role: true,
        createdAt: true, balance: true, referralCode: true,
      },
    })
    return NextResponse.json({ data: user })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data.' }, { status: 400 })
    }

    // Strip empty strings so we never overwrite existing values with ''
    const updates = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => typeof v === 'string' ? v.trim() !== '' : v !== undefined)
    )

    if (Object.keys(updates).length === 0) {
      const current = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, firstName: true, lastName: true, username: true },
      })
      return NextResponse.json({ data: current })
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
      select: { id: true, firstName: true, lastName: true, username: true },
    })

    return NextResponse.json({ data: user })
  } catch (error: unknown) {
    const code = (error as any)?.code
    if (code === 'P2002') {
      return NextResponse.json({ error: 'Username is already taken.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
