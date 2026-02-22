import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { target, userId, type, title, message } = await req.json()
    if (!title?.trim() || !message?.trim()) return NextResponse.json({ error: 'Title and message required.' }, { status: 400 })

    if (target === 'specific') {
      if (!userId) return NextResponse.json({ error: 'User ID required.' }, { status: 400 })
      await prisma.notification.create({ data: { userId, type: type || 'SYSTEM', title, message } })
      return NextResponse.json({ count: 1 })
    }

    // all active users — use createMany for performance
    const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } })
    await prisma.notification.createMany({
      data: users.map((u) => ({ userId: u.id, type: type || 'SYSTEM', title, message })),
      skipDuplicates: true,
    })
    return NextResponse.json({ count: users.length })
  } catch {
    return NextResponse.json({ error: 'Unauthorized or server error.' }, { status: 500 })
  }
}
