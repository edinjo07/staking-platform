import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyWebhookSignature } from '@/lib/westwallet'
import { sendDepositConfirmedEmail } from '@/lib/mail'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const sig = req.headers.get('x-webhook-signature') || ''

    if (!verifyWebhookSignature(body, sig)) {
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
    }

    const payload = JSON.parse(body)
    const { address, amount, currency, txHash, confirmations, status } = payload

    if (!address) return NextResponse.json({ error: 'Missing address.' }, { status: 400 })

    const deposit = await prisma.deposit.findFirst({
      where: { address },
      include: { user: true, currency: true },
    })

    if (!deposit) {
      return NextResponse.json({ error: 'Deposit not found.' }, { status: 404 })
    }

    const isConfirming = status === 'confirmed' && deposit.status !== 'CONFIRMED'
    const incomingAmount = parseFloat(amount)

    // Reject confirm webhooks with invalid/missing amount
    if (isConfirming && (isNaN(incomingAmount) || incomingAmount <= 0)) {
      console.error('[DEPOSIT_WEBHOOK] Invalid amount in confirm payload:', amount)
      return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 })
    }

    // Use incoming amount when present, fall back to stored amount only for non-confirm updates
    const resolvedAmount = isNaN(incomingAmount) ? deposit.amount : incomingAmount

    // Check minimum deposit requirement
    if (isConfirming && resolvedAmount < deposit.currency.minDeposit) {
      // Update deposit as FAILED — below minimum
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: {
          txHash,
          confirmations: confirmations || 0,
          amount: resolvedAmount,
          status: 'FAILED',
        },
      })
      await prisma.notification.create({
        data: {
          userId: deposit.userId,
          type: 'DEPOSIT',
          title: 'Deposit Below Minimum',
          message: `Your deposit of ${amount} ${currency} is below the minimum of ${deposit.currency.minDeposit} ${currency} and was not credited.`,
        },
      })
      return NextResponse.json({ success: true })
    }

    if (isConfirming) {
      // Wrap deposit update + balance credit in one atomic transaction.
      // Atomically claim the PENDING→CONFIRMED transition first to prevent
      // double-credit if two webhook deliveries arrive simultaneously.
      const usdAmount = resolvedAmount // In a real system: convert via exchange rate

      await prisma.$transaction(async (tx) => {
        const updated = await tx.deposit.updateMany({
          where: { id: deposit.id, status: 'PENDING' },
          data: {
            txHash,
            confirmations: confirmations || 0,
            amount: usdAmount,
            status: 'CONFIRMED',
            confirmedAt: new Date(),
          },
        })

        // If count is 0, another request already confirmed this deposit — bail out
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
            description: `Deposit: ${amount} ${currency}`,
            referenceId: deposit.id,
          },
        })

        await tx.notification.create({
          data: {
            userId: deposit.userId,
            type: 'DEPOSIT',
            title: 'Deposit Confirmed',
            message: `Your deposit of ${amount} ${currency} has been confirmed.`,
          },
        })
      })

      // Send email (non-blocking)
      sendDepositConfirmedEmail(deposit.user.email, incomingAmount, currency).catch(console.error)
    } else {
      // Update confirmations / amount only while still PENDING — never overwrite a CONFIRMED deposit
      await prisma.deposit.updateMany({
        where: { id: deposit.id, status: 'PENDING' },
        data: {
          txHash,
          confirmations: confirmations || 0,
          amount: resolvedAmount,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DEPOSIT_WEBHOOK]', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
