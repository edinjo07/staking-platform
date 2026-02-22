import { NextRequest, NextResponse } from 'next/server'
import { requireWorker } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// GET /api/worker/users/:id — full profile for the detail page
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireWorker()
    const { id } = await params

    // Resolve caller's domain for scoping
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { domainId: true },
    })
    const callerDomainId = me?.domainId ?? null

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
        _count: { select: { stakes: true, deposits: true, withdrawals: true, transactions: true } },
        stakes: {
          orderBy: { createdAt: 'desc' },
          take: 30,
          select: {
            id: true, amount: true, currency: true, status: true,
            dailyRoi: true, totalRoi: true, totalEarned: true, expectedReturn: true,
            startDate: true, endDate: true, createdAt: true,
            plan: { select: { name: true } },
          },
        },
        deposits: {
          orderBy: { createdAt: 'desc' },
          take: 30,
          select: {
            id: true, amount: true, amountUsd: true, status: true,
            txHash: true, address: true, createdAt: true, confirmedAt: true,
            currency: { select: { symbol: true, name: true } },
          },
        },
        withdrawals: {
          orderBy: { createdAt: 'desc' },
          take: 30,
          select: {
            id: true, amount: true, amountUsd: true, netAmount: true, fee: true,
            status: true, walletAddress: true, txHash: true, note: true,
            createdAt: true, reviewedAt: true,
            currency: { select: { symbol: true, name: true } },
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 30,
          select: {
            id: true, type: true, amount: true, currency: true,
            status: true, description: true, createdAt: true,
          },
        },
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    // Domain guard: workers can only view users in their own domain
    if (callerDomainId && user.domainId !== callerDomainId) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }
    return NextResponse.json({ data: user })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// PATCH /api/worker/users/:id — edit email, status, balance
// Body: { email?, isActive?, bannedReason?, balanceDelta?, balanceSet?, note? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireWorker()
    const { id } = await params

    // Resolve caller's domain
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { domainId: true },
    })
    const callerDomainId = me?.domainId ?? null

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, balance: true, email: true, bannedAt: true, domainId: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    // Workers cannot modify ADMIN accounts
    if (user.role === 'ADMIN') {
      return NextResponse.json({ error: 'Cannot modify admin accounts.' }, { status: 403 })
    }
    // Domain guard
    if (callerDomainId && user.domainId !== callerDomainId) {
      return NextResponse.json({ error: 'Forbidden: user belongs to a different domain.' }, { status: 403 })
    }

    const body = await req.json()
    const data: Record<string, unknown> = {}

    // Email update
    if (typeof body.email === 'string' && body.email.trim()) {
      const existing = await prisma.user.findFirst({
        where: { email: body.email.trim().toLowerCase(), NOT: { id } },
      })
      if (existing) return NextResponse.json({ error: 'Email already in use.' }, { status: 409 })
      data.email = body.email.trim().toLowerCase()
    }

    // Active toggle
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive

    // Ban / unban
    if (body.ban === true) {
      data.bannedAt = new Date()
      data.bannedReason = typeof body.bannedReason === 'string' ? body.bannedReason : null
    } else if (body.ban === false) {
      data.bannedAt = null
      data.bannedReason = null
    }

    // Balance: set an exact value
    if (typeof body.balanceSet === 'number') {
      data.balance = body.balanceSet
    }

    // Balance: add (positive) or subtract (negative) a delta
    if (typeof body.balanceDelta === 'number' && body.balanceDelta !== 0) {
      const newBalance = Number(user.balance) + body.balanceDelta
      data.balance = Math.max(0, newBalance)
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided.' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        isActive: true,
        bannedAt: true,
        bannedReason: true,
        balance: true,
        role: true,
      },
    })

    // Record balance change as a transaction when balance was modified
    const balanceChanged = 'balance' in data
    if (balanceChanged) {
      const delta =
        typeof body.balanceDelta === 'number'
          ? body.balanceDelta
          : Number(data.balance) - Number(user.balance)
      await prisma.transaction.create({
        data: {
          userId: id,
          type: delta >= 0 ? 'ADMIN_CREDIT' : 'ADMIN_DEBIT',
          amount: Math.abs(delta),
          currency: 'USD',
          status: 'COMPLETED',
          description: body.note || (delta >= 0 ? 'Balance credit by worker' : 'Balance debit by worker'),
        },
      })
    }

    return NextResponse.json({ data: updated })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
