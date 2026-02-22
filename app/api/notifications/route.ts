import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const typeFilter = searchParams.get('type')

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly ? { isRead: false } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ data: notifications })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
