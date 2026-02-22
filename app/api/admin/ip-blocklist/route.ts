import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET() {
  await requireAdmin()

  const data = await prisma.ipBlocklist.findMany({ orderBy: { blockedAt: 'desc' } })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  await requireAdmin()

  const { ip, reason } = await req.json()
  if (!ip?.trim()) return NextResponse.json({ error: 'IP required.' }, { status: 400 })

  const existing = await prisma.ipBlocklist.findFirst({ where: { ip: ip.trim() } })
  if (existing) return NextResponse.json({ error: 'IP already blocked.' }, { status: 409 })

  const record = await prisma.ipBlocklist.create({ data: { ip: ip.trim(), reason: reason?.trim() || null } })
  return NextResponse.json({ data: record }, { status: 201 })
}
