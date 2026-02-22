import { NextRequest, NextResponse } from 'next/server'
import { requireWorker } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2).optional(),
  dailyRoi: z.number().positive().optional(),
  durationDays: z.number().int().positive().optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().nullable().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  description: z.string().optional(),
})

// PATCH /api/worker/staking/plans/:id — edit a domain-owned plan
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireWorker()
    const { id } = await params

    const existing = await prisma.stakingPlan.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Plan not found.' }, { status: 404 })
    // Workers can only edit domain-owned plans, not global admin plans
    if (!existing.domainId) {
      return NextResponse.json({ error: 'Cannot modify global admin plans.' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const updates = { ...parsed.data } as Record<string, unknown>

    // Recompute totalRoi when ROI params change
    if (updates.dailyRoi !== undefined || updates.durationDays !== undefined) {
      const dailyRoi   = (updates.dailyRoi   as number) ?? existing.dailyRoi
      const durationDays = (updates.durationDays as number) ?? existing.durationDays
      updates.totalRoi = parseFloat((dailyRoi * durationDays).toFixed(4))
    }

    const plan = await prisma.stakingPlan.update({
      where: { id },
      data: updates,
      include: { domain: { select: { id: true, domain: true, name: true } } },
    })

    return NextResponse.json({ data: plan })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// DELETE /api/worker/staking/plans/:id — delete a domain-owned plan
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireWorker()
    const { id } = await params

    const existing = await prisma.stakingPlan.findUnique({
      where: { id },
      select: { id: true, domainId: true, _count: { select: { stakes: true } } },
    })
    if (!existing) return NextResponse.json({ error: 'Plan not found.' }, { status: 404 })
    if (!existing.domainId) {
      return NextResponse.json({ error: 'Cannot delete global admin plans.' }, { status: 403 })
    }
    if (existing._count.stakes > 0) {
      return NextResponse.json(
        { error: `Cannot delete: plan has ${existing._count.stakes} active stake(s).` },
        { status: 409 }
      )
    }

    await prisma.stakingPlan.delete({ where: { id } })
    return NextResponse.json({ message: 'Plan deleted.' })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
