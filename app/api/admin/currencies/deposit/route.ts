import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  symbol:          z.string().min(1).max(20),
  name:            z.string().min(1),
  network:         z.string().min(1),
  minDeposit:      z.number().min(0),
  isActive:        z.boolean().default(true),
  iconUrl:         z.string().url().optional().nullable(),
  contractAddress: z.string().optional().nullable(),
  decimals:        z.number().int().min(0).max(36).default(18),
})

export async function GET() {
  try {
    await requireAdmin()
    // domainId = null → global/admin-managed currencies
    const data = await prisma.depositCurrency.findMany({
      where: { domainId: null },
      orderBy: { symbol: 'asc' },
    })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid input' }, { status: 400 })

    const { symbol, name, network, minDeposit, isActive, iconUrl, contractAddress, decimals } = parsed.data
    const currency = await prisma.depositCurrency.create({
      data: {
        symbol: symbol.toUpperCase(), name, network, minDeposit,
        isActive, iconUrl: iconUrl ?? null,
        contractAddress: contractAddress ?? null, decimals,
        domainId: null,
      },
    })
    return NextResponse.json({ data: currency }, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') return NextResponse.json({ error: 'Currency with this symbol already exists.' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to create currency.' }, { status: 500 })
  }
}
