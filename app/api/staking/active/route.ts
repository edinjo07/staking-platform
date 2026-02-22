import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await requireAuth()
    const stakes = await prisma.stake.findMany({
      where: { userId: session.user.id, status: 'ACTIVE' },
      include: {
        plan: { select: { name: true, dailyRoi: true, durationDays: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: stakes })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
