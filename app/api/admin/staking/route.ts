import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  dailyRoi: z.number().positive(),
  durationDays: z.number().int().positive(),
  minAmount: z.number().positive(),
  maxAmount: z.number().positive().nullable().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  description: z.string().optional(),
})

export async function GET() {
  try {
    await requireAdmin()
    const plans = await prisma.stakingPlan.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ data: plans })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { dailyRoi, durationDays, ...rest } = parsed.data
    const totalRoi = parseFloat((dailyRoi * durationDays).toFixed(4))

    const plan = await prisma.stakingPlan.create({
      data: { ...rest, dailyRoi, durationDays, totalRoi },
    })
    return NextResponse.json({ data: plan }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
