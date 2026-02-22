import { NextRequest, NextResponse } from 'next/server'
import { requireWorker } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await requireWorker()
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { domainId: true },
    })
    if (!me?.domainId) {
      return NextResponse.json({ error: 'No domain assigned to your account.' }, { status: 403 })
    }

    const [domain, userCount, depositAgg, withdrawalAgg, activeStakes, staff] = await Promise.all([
      prisma.domain.findUnique({ where: { id: me.domainId } }),
      prisma.user.count({ where: { domainId: me.domainId, role: 'USER' } }),
      prisma.deposit.aggregate({
        where: { user: { domainId: me.domainId }, status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
      prisma.withdrawal.aggregate({
        where: { user: { domainId: me.domainId }, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.stake.count({ where: { user: { domainId: me.domainId }, status: 'ACTIVE' } }),
      prisma.user.findMany({
        where: { domainId: me.domainId, role: { in: ['WORKER', 'SUPPORT'] } },
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
        orderBy: { role: 'asc' },
      }),
    ])

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found.' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        ...domain,
        stats: {
          users: userCount,
          totalDeposits: depositAgg._sum.amount ?? 0,
          totalWithdrawals: withdrawalAgg._sum.amount ?? 0,
          activeStakes,
        },
        staff,
      },
      // `domains` array for dropdowns in other pages (consistent format)
      domains: [{ id: domain.id, domain: domain.domain, name: domain.name, isActive: domain.isActive }],
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireWorker()
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { domainId: true },
    })
    if (!me?.domainId) {
      return NextResponse.json({ error: 'No domain assigned to your account.' }, { status: 403 })
    }

    const body = await req.json()
    const { name, logoUrl, supportEmail } = body

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name?.trim() || null
    if (logoUrl !== undefined) data.logoUrl = logoUrl?.trim() || null
    if (supportEmail !== undefined) data.supportEmail = supportEmail?.trim() || null

    const updated = await prisma.domain.update({ where: { id: me.domainId }, data })
    return NextResponse.json({ data: updated })
  } catch (err) {
    if (err instanceof Error && err.message.includes('Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
