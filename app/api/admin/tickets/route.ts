import { NextRequest, NextResponse } from 'next/server'
import { requireSupport } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    await requireSupport()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const q = searchParams.get('q')

    const where: Record<string, unknown> = {}
    if (status && status !== 'ALL') where.status = status
    if (q) {
      where.OR = [
        { subject: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { username: { contains: q, mode: 'insensitive' } } },
      ]
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, username: true, firstName: true, lastName: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({ data: tickets })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
