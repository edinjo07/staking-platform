import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET() {
  try {
    await requireAdmin()

    const transactions = await prisma.transaction.findMany({
      include: {
        user: { select: { id: true, email: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    return NextResponse.json({ data: transactions })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
