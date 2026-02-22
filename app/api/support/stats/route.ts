import { NextResponse } from 'next/server'
import { requireSupport } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await requireSupport()

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { domainId: true },
    })

    if (!me?.domainId) {
      return NextResponse.json({ error: 'No domain assigned to your account.' }, { status: 403 })
    }

    const domainId = me.domainId

    // Resolved domain info
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      select: { id: true, domain: true, name: true, logoUrl: true, supportEmail: true, isActive: true },
    })

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found.' }, { status: 404 })
    }

    // All user IDs in this domain for nested-model queries (Ticket, ChatMessage)
    const domainUserIds = (
      await prisma.user.findMany({
        where: { domainId, role: 'USER' },
        select: { id: true },
      })
    ).map((u) => u.id)

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [
      totalUsers,
      newUsersThisWeek,
      openTickets,
      inProgressTickets,
      unreadChats,
      totalDeposits,
      totalWithdrawals,
      activeStakes,
      recentTickets,
      recentUsers,
      recentChats,
    ] = await Promise.all([
      prisma.user.count({ where: { domainId, role: 'USER' } }),
      prisma.user.count({ where: { domainId, role: 'USER', createdAt: { gte: weekAgo } } }),
      prisma.ticket.count({ where: { userId: { in: domainUserIds }, status: 'OPEN' } }),
      prisma.ticket.count({ where: { userId: { in: domainUserIds }, status: 'IN_PROGRESS' } }),
      prisma.chatMessage.count({ where: { userId: { in: domainUserIds }, isStaff: false, isRead: false } }),
      prisma.deposit.aggregate({
        where: { userId: { in: domainUserIds }, status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
      prisma.withdrawal.aggregate({
        where: { userId: { in: domainUserIds }, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.stake.count({ where: { userId: { in: domainUserIds }, status: 'ACTIVE' } }),
      // 8 most recent tickets for this domain
      prisma.ticket.findMany({
        where: { userId: { in: domainUserIds } },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      // 5 most recently registered users in this domain
      prisma.user.findMany({
        where: { domainId, role: 'USER' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, firstName: true, lastName: true, email: true, createdAt: true, balance: true },
      }),
      // 5 most recent support-awaiting chats (last user message)
      prisma.chatMessage.findMany({
        where: { userId: { in: domainUserIds }, isStaff: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        distinct: ['userId'],
      }),
    ])

    return NextResponse.json({
      data: {
        domain,
        stats: {
          totalUsers,
          newUsersThisWeek,
          openTickets,
          inProgressTickets,
          unreadChats,
          totalDeposits: Number(totalDeposits._sum.amount ?? 0),
          totalWithdrawals: Number(totalWithdrawals._sum.amount ?? 0),
          activeStakes,
        },
        recentTickets,
        recentUsers,
        recentChats,
      },
    })
  } catch (err) {
    if (err instanceof Error && (err.message.includes('Unauthorized') || err.message.includes('Forbidden'))) {
      return NextResponse.json({ error: err.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
