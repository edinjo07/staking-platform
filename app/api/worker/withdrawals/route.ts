import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireWorker } from '@/lib/auth-helpers'

export async function GET(req: NextRequest) {
  try {
    const session = await requireWorker()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const domainId = searchParams.get('domainId') || undefined
    const status = searchParams.get('status') || undefined
    const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10))

    // Workers only see withdrawals from domain-scoped users
    const userFilter = domainId
      ? { domainId }
      : { domainId: { not: null as string | null } }

    const where = {
      user: userFilter,
      ...(status && status !== 'ALL' ? { status } : {}),
    }

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              domain: { select: { id: true, domain: true, name: true } },
            },
          },
          currency: { select: { symbol: true, network: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: page * 50,
      }),
      prisma.withdrawal.count({ where }),
    ])

    return NextResponse.json({ withdrawals, total, page })
  } catch (error) {
    console.error('[worker/withdrawals GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
