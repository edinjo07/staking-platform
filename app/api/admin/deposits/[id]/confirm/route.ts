import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-helpers'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params

    const deposit = await prisma.deposit.findUnique({ where: { id } })
    if (!deposit) return NextResponse.json({ error: 'Deposit not found' }, { status: 404 })
    if (deposit.status !== 'PENDING') {
      return NextResponse.json({ error: 'Deposit is not in PENDING status' }, { status: 400 })
    }

    const creditAmount = deposit.amountUsd ?? deposit.amount

    await prisma.$transaction([
      prisma.deposit.update({
        where: { id },
        data: { status: 'CONFIRMED', confirmations: deposit.requiredConfirmations, confirmedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: deposit.userId },
        data: { balance: { increment: creditAmount } },
      }),
      prisma.transaction.create({
        data: {
          userId: deposit.userId,
          type: 'DEPOSIT',
          amount: creditAmount,
          currency: 'USD',
          status: 'COMPLETED',
          description: `Manual deposit confirmation (admin)`,
          referenceId: deposit.id,
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Confirm deposit error:', error)
    return NextResponse.json({ error: 'Failed to confirm deposit' }, { status: 500 })
  }
}
