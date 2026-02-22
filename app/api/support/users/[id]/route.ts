import { NextRequest, NextResponse } from 'next/server'
import { requireSupport } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// GET /api/support/users/:id — read-only profile, domain-ownership guarded
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSupport()
    const { id } = await params

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { domainId: true },
    })
    if (!me?.domainId) {
      return NextResponse.json({ error: 'No domain assigned to your account.' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        bannedAt: true,
        bannedReason: true,
        balance: true,
        twoFaEnabled: true,
        pinEnabled: true,
        referralCode: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
        domainId: true,
        domain: { select: { id: true, domain: true, name: true } },
        _count: { select: { stakes: true, deposits: true, withdrawals: true } },
        stakes: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true, amount: true, currency: true, status: true,
            dailyRoi: true, totalRoi: true, totalEarned: true, expectedReturn: true,
            startDate: true, endDate: true, createdAt: true,
            plan: { select: { name: true } },
          },
        },
        deposits: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true, amount: true, amountUsd: true, status: true,
            txHash: true, createdAt: true, confirmedAt: true,
            currency: { select: { symbol: true, name: true } },
          },
        },
        withdrawals: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true, amount: true, netAmount: true, fee: true,
            status: true, walletAddress: true, txHash: true,
            createdAt: true, reviewedAt: true,
            currency: { select: { symbol: true, name: true } },
          },
        },
        tickets: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true, subject: true, category: true, status: true, createdAt: true,
          },
        },
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    // Guard: this user must belong to the support agent's domain
    if (user.domainId !== me.domainId) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
    }

    return NextResponse.json({ data: user })
  } catch (err) {
    if (err instanceof Error && (err.message.includes('Unauthorized') || err.message.includes('Forbidden'))) {
      return NextResponse.json({ error: err.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
