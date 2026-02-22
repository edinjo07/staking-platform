import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await requireAuth()
    const plans = await prisma.stakingPlan.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
    })
    return NextResponse.json({ data: plans })
  } catch (error) {
    console.error('[STAKING_PLANS]', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
