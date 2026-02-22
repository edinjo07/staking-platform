import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const updates = { ...parsed.data } as Record<string, unknown>

    // Recompute totalRoi if dailyRoi or durationDays changes
    if (updates.dailyRoi !== undefined || updates.durationDays !== undefined) {
      const existing = await prisma.stakingPlan.findUnique({ where: { id } })
      if (!existing) return NextResponse.json({ error: 'Plan not found.' }, { status: 404 })
      const dailyRoi = (updates.dailyRoi as number) ?? existing.dailyRoi
      const durationDays = (updates.durationDays as number) ?? existing.durationDays
      updates.totalRoi = parseFloat((dailyRoi * durationDays).toFixed(4))
    }

    const plan = await prisma.stakingPlan.update({ where: { id }, data: updates })
    return NextResponse.json({ data: plan })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    await prisma.stakingPlan.delete({ where: { id } })
    return NextResponse.json({ message: 'Plan deleted.' })
  } catch {
    return NextResponse.json({ error: 'Unauthorized or plan has active stakes.' }, { status: 400 })
  }
}
