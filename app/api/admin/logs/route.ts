import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  await requireAdmin()

  const { searchParams } = new URL(req.url)
  const level = searchParams.get('level')
  const q = searchParams.get('q')

  const where: any = {}
  if (level && level !== 'all') where.level = level
  if (q) where.message = { contains: q, mode: 'insensitive' }

  const data = await prisma.systemLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 500
  })

  return NextResponse.json({ data })
}
