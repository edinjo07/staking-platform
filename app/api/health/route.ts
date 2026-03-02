import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const count = await prisma.stakingPlan.count({ where: { isActive: true } })
    return NextResponse.json({ ok: true, activePlans: count, dbUrl: process.env.DATABASE_URL?.slice(0, 40) + '...' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
