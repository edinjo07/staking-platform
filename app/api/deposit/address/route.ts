import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { createPayment, toNowPaymentsCode } from '@/lib/nowpayments'
import { z } from 'zod'

const schema = z.object({
  currencyId: z.string(),
  amountUsd: z.number().positive('Amount must be greater than 0'),
})

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid request.' }, { status: 400 })
    }

    const { currencyId, amountUsd } = parsed.data

    const currency = await prisma.depositCurrency.findUnique({
      where: { id: currencyId, isActive: true },
    })
    if (!currency) return NextResponse.json({ error: 'Currency not found.' }, { status: 404 })

    if (amountUsd < currency.minDeposit) {
      return NextResponse.json(
        { error: `Minimum deposit is $${currency.minDeposit} USD.` },
        { status: 400 }
      )
    }

    // Reuse a still-valid pending payment for the same user + currency + amount
    const existing = await prisma.deposit.findFirst({
      where: {
        userId: session.user.id,
        currencyId: currency.id,
        status: 'PENDING',
        amountUsd: amountUsd,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })
    if (existing?.paymentId) {
      return NextResponse.json({
        data: {
          depositId: existing.id,
          paymentId: existing.paymentId,
          address: existing.address,
          payAmount: existing.payAmount,
          payCurrency: existing.payCurrency,
          amountUsd: existing.amountUsd,
          expiresAt: existing.expiresAt,
          status: existing.status,
        },
      })
    }

    // Create a placeholder deposit first so we have an id for order_id
    const deposit = await prisma.deposit.create({
      data: {
        userId: session.user.id,
        currencyId: currency.id,
        address: 'pending',
        amount: 0,
        amountUsd: amountUsd,
        status: 'PENDING',
        requiredConfirmations: 3,
        confirmations: 0,
      },
    })

    // Create payment on NOWPayments
    let payment
    try {
      const ipnUrl = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/deposit/webhook`
        : undefined
      const nowCode = toNowPaymentsCode(currency.symbol, currency.network)
      payment = await createPayment(amountUsd, nowCode, deposit.id, ipnUrl)
    } catch (err) {
      // Clean up the placeholder deposit on failure
      await prisma.deposit.delete({ where: { id: deposit.id } }).catch(() => {})
      console.error('[DEPOSIT_CREATE] NOWPayments error:', err)
      return NextResponse.json(
        { error: 'Failed to create payment. Check NOWPAYMENTS_API_KEY in .env.local.' },
        { status: 500 }
      )
    }

    // Update deposit with real payment details
    const expiry = payment.expiration_estimate_date
      ? new Date(payment.expiration_estimate_date)
      : new Date(Date.now() + 60 * 60 * 1000) // fallback: 1 hour

    const updated = await prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        address: payment.pay_address,
        paymentId: payment.payment_id,
        payCurrency: payment.pay_currency,
        payAmount: payment.pay_amount,
        expiresAt: expiry,
      },
    })

    return NextResponse.json({
      data: {
        depositId: updated.id,
        paymentId: updated.paymentId,
        address: updated.address,
        payAmount: updated.payAmount,
        payCurrency: updated.payCurrency,
        amountUsd: updated.amountUsd,
        expiresAt: updated.expiresAt,
        status: updated.status,
      },
    })
  } catch (error) {
    console.error('[DEPOSIT_ADDRESS]', error)
    return NextResponse.json({ error: 'Failed to create deposit.' }, { status: 500 })
  }
}
