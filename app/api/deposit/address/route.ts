import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { generateDepositAddress } from '@/lib/westwallet'
import { z } from 'zod'

const schema = z.object({ currencyId: z.string() })

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

    const currency = await prisma.depositCurrency.findUnique({
      where: { id: parsed.data.currencyId, isActive: true },
    })
    if (!currency) return NextResponse.json({ error: 'Currency not found.' }, { status: 404 })

    // Check if user already has an address for this currency
    const existing = await prisma.deposit.findFirst({
      where: { userId: session.user.id, currencyId: currency.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    })
    if (existing?.address) {
      return NextResponse.json({ data: { address: existing.address } })
    }

    // Generate new address via WestWallet
    const result = await generateDepositAddress(currency.symbol, session.user.id)

    if (!result?.address) {
      return NextResponse.json({ error: 'Failed to generate address.' }, { status: 500 })
    }

    const deposit = await prisma.deposit.create({
      data: {
        userId: session.user.id,
        currencyId: currency.id,
        address: result.address,
        amount: 0,
        status: 'PENDING',
        requiredConfirmations: 3,
        confirmations: 0,
      },
    })

    return NextResponse.json({ data: { address: deposit.address } })
  } catch (error) {
    console.error('[DEPOSIT_ADDRESS]', error)
    return NextResponse.json({ error: 'Failed to generate address.' }, { status: 500 })
  }
}
