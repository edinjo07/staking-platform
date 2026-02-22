import { NextResponse } from 'next/server'
import { requireSupport } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await requireSupport()

    // Determine domain scope: if the caller has a domainId (worker/support agent)
    // only show users from that domain. Admins (no domainId) see all domain users.
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { domainId: true },
    })
    const callerDomainId = me?.domainId ?? null

    // Get distinct user IDs that have chat messages and belong to a domain
    const sessions = await prisma.chatMessage.groupBy({
      by: ['userId'],
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: 'desc' } },
    })

    const userIds = sessions.map((s) => s.userId)

    // Scope: if agent has a domain, restrict to that domain; otherwise all domain users
    const domainFilter = callerDomainId
      ? { domainId: callerDomainId }
      : { domainId: { not: null as string | null } }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, ...domainFilter },
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

    const visibleUserIds = users.map((u) => u.id)

    const lastMessages = await Promise.all(
      visibleUserIds.map(async (userId) => {
        const msg = await prisma.chatMessage.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: { content: true, createdAt: true, isStaff: true },
        })
        const unread = await prisma.chatMessage.count({
          where: { userId, isStaff: false, isRead: false },
        })
        return { userId, lastMessage: msg?.content, lastAt: msg?.createdAt, unreadCount: unread }
      })
    )

    const data = visibleUserIds.map((id) => {
      const user = users.find((u) => u.id === id)
      const last = lastMessages.find((l) => l.userId === id)
      return { ...user, ...last }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[worker/chat GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
