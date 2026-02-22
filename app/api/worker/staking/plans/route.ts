import { NextRequest, NextResponse } from 'next/server'
import { requireWorker } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  domainId: z.string().min(1),
  name: z.string().min(2),
  dailyRoi: z.number().positive(),
  durationDays: z.number().int().positive(),
  minAmount: z.number().positive(),
  maxAmount: z.number().positive().nullable().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  description: z.string().optional(),
})

// GET /api/worker/staking/plans?domainId=  — list domain-owned plans
export async function GET(req: NextRequest) {
  try {
    await requireWorker()

    const { searchParams } = new URL(req.url)
    const domainId = searchParams.get('domainId') || undefined

    const where = domainId
      ? { domainId }
      : { domainId: { not: null as string | null } } // all non-global plans

    const plans = await prisma.stakingPlan.findMany({
      where,
      orderBy: [{ domain: { domain: 'asc' } }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        domain: { select: { id: true, domain: true, name: true } },
        _count: { select: { stakes: true } },
      },
    })

    return NextResponse.json({ data: plans })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// POST /api/worker/staking/plans — create a plan for a domain
export async function POST(req: NextRequest) {
  try {
    await requireWorker()

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { dailyRoi, durationDays, domainId, ...rest } = parsed.data
    const totalRoi = parseFloat((dailyRoi * durationDays).toFixed(4))

    // Validate domain exists
    const domain = await prisma.domain.findUnique({ where: { id: domainId } })
    if (!domain) return NextResponse.json({ error: 'Domain not found.' }, { status: 404 })

    const plan = await prisma.stakingPlan.create({
      data: { ...rest, dailyRoi, durationDays, totalRoi, domainId },
      include: {
        domain: { select: { id: true, domain: true, name: true } },
      },
    })

    return NextResponse.json({ data: plan }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
