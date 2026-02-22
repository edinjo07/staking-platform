import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET() {
  try {
    await requireAdmin()

    const stakes = await prisma.stake.findMany({
      include: {
        user: { select: { id: true, email: true, username: true } },
        plan: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    return NextResponse.json({ data: stakes })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
