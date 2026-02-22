import { NextRequest, NextResponse } from 'next/server'
import { requireSupport } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await requireSupport()

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { domainId: true },
    })
    if (!me?.domainId) {
      return NextResponse.json({ error: 'No domain assigned to your account.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || undefined
    const status = searchParams.get('status') || undefined

    const where: Record<string, unknown> = {
      domainId: me.domainId,
      role: 'USER',
    }

    if (q) {
      where.OR = [
        { email:     { contains: q, mode: 'insensitive' } },
        { username:  { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName:  { contains: q, mode: 'insensitive' } },
      ]
    }

    if (status === 'BANNED')   { where.bannedAt = { not: null } }
    else if (status === 'ACTIVE')   { where.bannedAt = null; where.isActive = true }
    else if (status === 'INACTIVE') { where.bannedAt = null; where.isActive = false }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        balance: true,
        isActive: true,
        bannedAt: true,
        createdAt: true,
        _count: { select: { stakes: true, deposits: true } },
      },
    })

    return NextResponse.json({ data: users })
  } catch (err) {
    if (err instanceof Error && (err.message.includes('Unauthorized') || err.message.includes('Forbidden'))) {
      return NextResponse.json({ error: err.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
