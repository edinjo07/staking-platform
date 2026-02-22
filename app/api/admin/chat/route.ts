import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET() {
  await requireAdmin()

  // Get distinct user IDs that have chat messages
  const sessions = await prisma.chatMessage.groupBy({
    by: ['userId'],
    _max: { createdAt: true },
    _count: { id: true },
    orderBy: { _max: { createdAt: 'desc' } }
  })

  const userIds = sessions.map((s) => s.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
      balance: true,
      createdAt: true,
      domain: { select: { id: true, domain: true, name: true } },
    },
  })

  // Get last message per user
  const lastMessages = await Promise.all(
    userIds.map(async (userId) => {
      const msg = await prisma.chatMessage.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { content: true, createdAt: true, isStaff: true }
      })
      const unread = await prisma.chatMessage.count({
        where: { userId, isStaff: false, isRead: false }
      })
      return { userId, lastMessage: msg?.content, lastAt: msg?.createdAt, unreadCount: unread }
    })
  )

  const data = userIds.map((id) => {
    const user = users.find((u) => u.id === id)
    const last = lastMessages.find((l) => l.userId === id)
    return { ...user, ...last }
  })

  return NextResponse.json({ data })
}

