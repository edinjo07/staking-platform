import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await requireAuth()
    const currencies = await prisma.depositCurrency.findMany({
      where: { isActive: true },
      select: {
        id: true, symbol: true, name: true, network: true,
        minDeposit: true, iconUrl: true,
      },
      orderBy: { symbol: 'asc' },
    })
    return NextResponse.json({ data: currencies })
  } catch (error) {
    console.error('[DEPOSIT_CURRENCIES]', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
