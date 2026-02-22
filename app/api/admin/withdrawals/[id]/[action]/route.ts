import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { sendWithdrawal } from '@/lib/westwallet'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    await requireAdmin()
    const { id: withdrawalId, action } = await params

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: true, currency: true },
    })
    if (!withdrawal) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    if (withdrawal.status !== 'PENDING') {
      return NextResponse.json({ error: 'Already processed.' }, { status: 400 })
    }

    if (action === 'approve') {
      try {
        const tx = await sendWithdrawal(
          withdrawal.currency.symbol,
          withdrawal.netAmount,
          withdrawal.walletAddress,
          withdrawalId
        )

        await prisma.$transaction([
          prisma.withdrawal.update({
            where: { id: withdrawalId },
            data: { status: 'COMPLETED', txHash: tx.txHash, processedAt: new Date() },
          }),
          prisma.transaction.updateMany({
            where: { referenceId: withdrawalId },
            data: { status: 'COMPLETED' },
          }),
          prisma.notification.create({
            data: {
              userId: withdrawal.userId,
              type: 'WITHDRAWAL',
              title: 'Withdrawal Approved',
              message: `Your withdrawal of $${withdrawal.amount} has been approved and is processing.`,
            },
          }),
        ])

        return NextResponse.json({ message: 'Withdrawal approved and sent.' })
      } catch (err) {
        await prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: 'FAILED' },
        })
        return NextResponse.json({ error: 'Failed to send via WestWallet.' }, { status: 500 })
      }
    }

    if (action === 'reject') {
      await prisma.$transaction([
        prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: 'REJECTED', processedAt: new Date() },
        }),
        // Refund user
        prisma.user.update({
          where: { id: withdrawal.userId },
          data: { balance: { increment: withdrawal.amount } },
        }),
        prisma.notification.create({
          data: {
            userId: withdrawal.userId,
            type: 'WITHDRAWAL',
            title: 'Withdrawal Rejected',
            message: `Your withdrawal of $${withdrawal.amount} was rejected. Funds have been returned to your balance.`,
          },
        }),
      ])
      return NextResponse.json({ message: 'Withdrawal rejected and refunded.' })
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized or server error.' }, { status: 500 })
  }
}
