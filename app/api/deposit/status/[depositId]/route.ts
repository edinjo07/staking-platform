import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { getPaymentStatus, isPaymentConfirmed, isPaymentFailed } from '@/lib/nowpayments'
import { sendDepositConfirmedEmail } from '@/lib/mail'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ depositId: string }> }
) {
  try {
    const session = await requireAuth()
    const { depositId } = await params

    const deposit = await prisma.deposit.findFirst({
      where: { id: depositId, userId: session.user.id },
      include: { user: true, currency: true },
    })

    if (!deposit) {
      return NextResponse.json({ error: 'Deposit not found.' }, { status: 404 })
    }

    // Already in a terminal state — return immediately
    if (deposit.status === 'CONFIRMED' || deposit.status === 'FAILED') {
      return NextResponse.json({ data: { status: deposit.status, deposit } })
    }

    if (!deposit.paymentId) {
      return NextResponse.json({ data: { status: deposit.status, deposit } })
    }

    // Poll NOWPayments for live status
    let npStatus
    try {
      npStatus = await getPaymentStatus(deposit.paymentId)
    } catch (err) {
      console.error('[DEPOSIT_STATUS] NOWPayments poll error:', err)
      // Return last known status from DB if API fails
      return NextResponse.json({ data: { status: deposit.status, deposit } })
    }

    const nowStatus = npStatus.payment_status

    if (isPaymentConfirmed(nowStatus) && deposit.status !== 'CONFIRMED') {
      // Credit user balance — use actually_paid amount or original estimate
      const cryptoAmount = npStatus.actually_paid || npStatus.pay_amount || 0
      const usdAmount = deposit.amountUsd ?? deposit.amount

      await prisma.$transaction(async (tx) => {
        const updated = await tx.deposit.updateMany({
          where: { id: deposit.id, status: { notIn: ['CONFIRMED'] } },
          data: {
            status: 'CONFIRMED',
            amount: usdAmount,
            payAmount: cryptoAmount,
            confirmations: 3,
            confirmedAt: new Date(),
            txHash: npStatus.outcome_amount ? String(npStatus.outcome_amount) : deposit.txHash,
          },
        })
        if (updated.count === 0) return

        await tx.user.update({
          where: { id: deposit.userId },
          data: { balance: { increment: usdAmount } },
        })

        await tx.transaction.create({
          data: {
            userId: deposit.userId,
            type: 'DEPOSIT',
            amount: usdAmount,
            status: 'COMPLETED',
            description: `Deposit: ${cryptoAmount} ${(deposit.payCurrency ?? '').toUpperCase()} (~$${usdAmount} USD)`,
            referenceId: deposit.id,
          },
        })

        await tx.notification.create({
          data: {
            userId: deposit.userId,
            type: 'DEPOSIT',
            title: 'Deposit Confirmed',
            message: `Your deposit of $${usdAmount} USD has been confirmed.`,
          },
        })
      })

      sendDepositConfirmedEmail(deposit.user.email, usdAmount, (deposit.payCurrency ?? '').toUpperCase()).catch(console.error)

      return NextResponse.json({ data: { status: 'CONFIRMED', nowStatus } })
    }

    if (isPaymentFailed(nowStatus) && deposit.status !== 'FAILED') {
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: { status: 'FAILED' },
      })
      return NextResponse.json({ data: { status: 'FAILED', nowStatus } })
    }

    // Partially paid
    if (nowStatus === 'partially_paid') {
      return NextResponse.json({ data: { status: 'PARTIALLY_PAID', nowStatus, actuallyPaid: npStatus.actually_paid } })
    }

    return NextResponse.json({ data: { status: deposit.status, nowStatus } })
  } catch (error) {
    console.error('[DEPOSIT_STATUS]', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
