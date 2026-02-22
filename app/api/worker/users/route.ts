import { NextRequest, NextResponse } from 'next/server'
import { requireWorker } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await requireWorker()
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { domainId: true },
    })
    const callerDomainId = me?.domainId ?? null

    const { searchParams } = new URL(req.url)
    const domainId = searchParams.get('domainId') || undefined
    const q = searchParams.get('q') || undefined
    const status = searchParams.get('status') || undefined

    const roleParam = searchParams.get('role') || undefined

    const where: Record<string, unknown> = {
      role: roleParam === 'SUPPORT' ? 'SUPPORT'
           : roleParam === 'USER'    ? 'USER'
           : { in: ['USER', 'SUPPORT'] }, // default: show both
    }

    // Workers are always scoped to their own domain; admins may filter by any domain
    if (callerDomainId) {
      where.domainId = callerDomainId
    } else if (domainId) {
      where.domainId = domainId
    } else {
      where.domainId = { not: null } // only users who came through a domain
    }

    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (status === 'BANNED') where.bannedAt = { not: null }
    else if (status === 'ACTIVE') { where.bannedAt = null; where.isActive = true }
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
        role: true,
        balance: true,
        isActive: true,
        bannedAt: true,
        createdAt: true,
        domainId: true,
        domain: { select: { id: true, domain: true, name: true } },
        _count: { select: { stakes: true, deposits: true } },
      },
    })

    return NextResponse.json({ data: users })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
