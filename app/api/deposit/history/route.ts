import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await requireAuth()
    const deposits = await prisma.deposit.findMany({
      where: { userId: session.user.id, amount: { gt: 0 } },
      include: { currency: { select: { symbol: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({ data: deposits })
  } catch (error) {
    console.error('[DEPOSIT_HISTORY]', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
