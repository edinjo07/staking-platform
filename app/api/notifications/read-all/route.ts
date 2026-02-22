import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    const session = await requireAuth()
    const now = new Date()
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true, readAt: now },
    })
    return NextResponse.json({ message: 'Marked all as read.' })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
