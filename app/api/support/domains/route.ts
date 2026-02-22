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

    const domain = await prisma.domain.findUnique({
      where: { id: me.domainId },
      select: {
        id: true,
        domain: true,
        name: true,
        logoUrl: true,
        supportEmail: true,
        isActive: true,
        createdAt: true,
      },
    })

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found.' }, { status: 404 })
    }

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    // Collect domain user IDs for nested-model queries
    const domainUserIds = (
      await prisma.user.findMany({
        where: { domainId: me.domainId, role: 'USER' },
        select: { id: true },
      })
    ).map((u) => u.id)

    const [
      totalUsers,
      newUsersThisWeek,
      activeStakes,
      openTickets,
      inProgressTickets,
      unreadChats,
      depositAgg,
      withdrawalAgg,
      pendingDeposits,
      pendingWithdrawals,
    ] = await Promise.all([
      prisma.user.count({ where: { domainId: me.domainId, role: 'USER' } }),
      prisma.user.count({ where: { domainId: me.domainId, role: 'USER', createdAt: { gte: weekAgo } } }),
      prisma.stake.count({ where: { userId: { in: domainUserIds }, status: 'ACTIVE' } }),
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
      prisma.deposit.count({ where: { userId: { in: domainUserIds }, status: 'PENDING' } }),
      prisma.withdrawal.count({ where: { userId: { in: domainUserIds }, status: 'PENDING' } }),
    ])

    return NextResponse.json({
      data: {
        domain,
        stats: {
          totalUsers,
          newUsersThisWeek,
          activeStakes,
          openTickets,
          inProgressTickets,
          unreadChats,
          totalDeposits: Number(depositAgg._sum.amount ?? 0),
          totalWithdrawals: Number(withdrawalAgg._sum.amount ?? 0),
          pendingDeposits,
          pendingWithdrawals,
        },
      },
    })
  } catch (err) {
    if (err instanceof Error && (err.message.includes('Unauthorized') || err.message.includes('Forbidden'))) {
      return NextResponse.json({ error: err.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
