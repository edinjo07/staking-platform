import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET() {
  await requireAdmin()

  const data = await prisma.domain.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { users: true } } },
  })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  await requireAdmin()

  const { domain, name } = await req.json()
  if (!domain?.trim()) return NextResponse.json({ error: 'Domain required.' }, { status: 400 })

  const existing = await prisma.domain.findFirst({ where: { domain: domain.trim().toLowerCase() } })
  if (existing) return NextResponse.json({ error: 'Domain already exists.' }, { status: 409 })

  const created = await prisma.domain.create({
    data: { domain: domain.trim().toLowerCase(), name: name?.trim() || null, isActive: true },
  })

  // Automatically copy all global admin plans (domainId = null) to the new domain
  const globalPlans = await prisma.stakingPlan.findMany({
    where: { domainId: null },
  })

  if (globalPlans.length > 0) {
    await prisma.stakingPlan.createMany({
      data: globalPlans.map(({ id: _id, createdAt: _c, updatedAt: _u, ...p }) => ({
        ...p,
        domainId: created.id,
      })),
    })
  }

  // Automatically copy all global admin deposit currencies (domainId = null) to the new domain
  const globalCurrencies = await prisma.depositCurrency.findMany({ where: { domainId: null } })

  if (globalCurrencies.length > 0) {
    await prisma.depositCurrency.createMany({
      data: globalCurrencies.map(({ id: _id, createdAt: _c, updatedAt: _u, ...cur }) => ({
        ...cur,
        domainId: created.id,
      })),
    })
  }

  // Automatically copy all global admin withdrawal currencies (domainId = null) to the new domain
  const globalWithdrawalCurrencies = await prisma.withdrawalCurrency.findMany({ where: { domainId: null } })

  if (globalWithdrawalCurrencies.length > 0) {
    await prisma.withdrawalCurrency.createMany({
      data: globalWithdrawalCurrencies.map(({ id: _id, createdAt: _c, updatedAt: _u, ...cur }) => ({
        ...cur,
        domainId: created.id,
      })),
    })
  }

  return NextResponse.json({ data: created }, { status: 201 })
}
