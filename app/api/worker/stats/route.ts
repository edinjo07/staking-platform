import { NextRequest, NextResponse } from 'next/server'
import { requireWorker } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await requireWorker()
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { domainId: true },
    })
    const callerDomainId = me?.domainId ?? null

    const { searchParams } = new URL(req.url)
    // Workers are always scoped to their own domain; admins may pass ?domainId=
    const effectiveDomainId: string | undefined =
      callerDomainId ?? (searchParams.get('domainId') || undefined)

    // Build user ID scope: only users on the selected domain(s)
    const userWhere = effectiveDomainId
      ? { domainId: effectiveDomainId }
      : { domainId: { not: null as string | null } }

    // If a domain is selected, we need user IDs for nested filters
    const scopedUserIds = effectiveDomainId
      ? (await prisma.user.findMany({ where: { domainId: effectiveDomainId }, select: { id: true } })).map((u) => u.id)
      : null

    const stakeWhere = scopedUserIds ? { userId: { in: scopedUserIds } } : {}
    const depositWhere = scopedUserIds ? { userId: { in: scopedUserIds } } : {}
    const withdrawalWhere = scopedUserIds ? { userId: { in: scopedUserIds } } : {}

    const [
      totalUsers,
      activeStakes,
      pendingDeposits,
      pendingWithdrawals,
      totalDeposited,
      totalWithdrawn,
      recentDeposits,
      recentWithdrawals,
    ] = await Promise.all([
      prisma.user.count({ where: { ...userWhere, role: 'USER' } }),
      prisma.stake.count({ where: { ...stakeWhere, status: 'ACTIVE' } }),
      prisma.deposit.count({ where: { ...depositWhere, status: 'PENDING' } }),
      prisma.withdrawal.count({ where: { ...withdrawalWhere, status: 'PENDING' } }),
      prisma.deposit.aggregate({
        where: { ...depositWhere, status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
      prisma.withdrawal.aggregate({
        where: { ...withdrawalWhere, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.deposit.findMany({
        where: depositWhere,
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          currency: { select: { symbol: true } },
        },
      }),
      prisma.withdrawal.findMany({
        where: withdrawalWhere,
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          currency: { select: { symbol: true } },
        },
      }),
    ])

    // Per-domain breakdown — scoped to caller's domain if they have one
    const domainFilter = callerDomainId ? { id: callerDomainId } : {}
    const domains = await prisma.domain.findMany({ where: domainFilter, orderBy: { domain: 'asc' } })

    const domainBreakdown = await Promise.all(
      domains.map(async (d) => {
        const dUserIds = (
          await prisma.user.findMany({ where: { domainId: d.id }, select: { id: true } })
        ).map((u) => u.id)

        const [users, stakes, deps, withdraws] = await Promise.all([
          prisma.user.count({ where: { domainId: d.id, role: 'USER' } }),
          prisma.stake.count({ where: { userId: { in: dUserIds }, status: 'ACTIVE' } }),
          prisma.deposit.count({ where: { userId: { in: dUserIds }, status: 'PENDING' } }),
          prisma.withdrawal.count({ where: { userId: { in: dUserIds }, status: 'PENDING' } }),
        ])

        return {
          id: d.id,
          domain: d.domain,
          name: d.name,
          isActive: d.isActive,
          users,
          activeStakes: stakes,
          pendingDeposits: deps,
          pendingWithdrawals: withdraws,
        }
      })
    )

    return NextResponse.json({
      data: {
        totalUsers,
        activeStakes,
        pendingDeposits,
        pendingWithdrawals,
        totalDeposited: Number(totalDeposited._sum.amount ?? 0),
        totalWithdrawn: Number(totalWithdrawn._sum.amount ?? 0),
        recentDeposits,
        recentWithdrawals,
        domainBreakdown,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
