import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireWorker } from '@/lib/auth-helpers'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireWorker()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deposit = await prisma.deposit.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, balance: true, domainId: true } },
      },
    })

    if (!deposit) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 })
    }

    // Workers can only confirm deposits belonging to domain users, not global users
    if (!deposit.user.domainId) {
      return NextResponse.json(
        { error: 'Cannot confirm deposits for global platform users' },
        { status: 403 }
      )
    }

    if (deposit.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Deposit is already ${deposit.status.toLowerCase()}` },
        { status: 409 }
      )
    }

    const creditAmount = deposit.amountUsd ?? deposit.amount

    await prisma.$transaction([
      prisma.deposit.update({
        where: { id: deposit.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
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
          description: `Deposit confirmed by worker`,
          status: 'COMPLETED',
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[worker/deposits/confirm PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
