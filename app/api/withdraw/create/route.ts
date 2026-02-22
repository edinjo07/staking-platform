import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  currencyId: z.string(),
  amount: z.number().positive(),
  walletAddress: z.string().min(10),
  pin: z.string().length(4).regex(/^\d{4}$/),
})

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const { currencyId, amount, walletAddress, pin } = parsed.data

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    // Verify PIN
    if (!user.pinEnabled || !user.pin) {
      return NextResponse.json({ error: 'Please set a withdrawal PIN first.' }, { status: 400 })
    }
    const pinValid = await bcrypt.compare(pin, user.pin)
    if (!pinValid) return NextResponse.json({ error: 'Invalid PIN.' }, { status: 400 })

    const currency = await prisma.withdrawalCurrency.findUnique({
      where: { id: currencyId, isActive: true },
    })
    if (!currency) return NextResponse.json({ error: 'Currency not found.' }, { status: 404 })

    if (amount < currency.minWithdrawal) {
      return NextResponse.json({ error: `Minimum withdrawal is $${currency.minWithdrawal}.` }, { status: 400 })
    }
    if (currency.maxWithdrawal && amount > currency.maxWithdrawal) {
      return NextResponse.json({ error: `Maximum withdrawal is $${currency.maxWithdrawal}.` }, { status: 400 })
    }
    const netAmount = Math.max(0, amount - currency.fee)

    const withdrawal = await prisma.$transaction(async (tx) => {
      // Re-read balance inside the transaction to prevent race-condition double-spend
      const freshUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { balance: true },
      })
      if (!freshUser || freshUser.balance < amount) {
        throw Object.assign(new Error('Insufficient balance.'), { code: 'INSUFFICIENT_BALANCE' })
      }

      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: amount } },
      })

      const w = await tx.withdrawal.create({
        data: {
          userId: user.id,
          currencyId,
          amount,
          fee: currency.fee,
          netAmount,
          walletAddress,
          status: 'PENDING',
          pinVerified: true,
        },
      })

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'WITHDRAWAL',
          amount,
          status: 'PENDING',
          description: `Withdrawal: ${amount} USD → ${currency.symbol}`,
          referenceId: w.id,
        },
      })

      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'WITHDRAWAL',
          title: 'Withdrawal Requested',
          message: `Your withdrawal of $${amount} is being processed.`,
        },
      })

      return w
    })

    return NextResponse.json({ data: { withdrawalId: withdrawal.id } }, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'INSUFFICIENT_BALANCE') {
      return NextResponse.json({ error: 'Insufficient balance.' }, { status: 400 })
    }
    console.error('[WITHDRAW_CREATE]', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
