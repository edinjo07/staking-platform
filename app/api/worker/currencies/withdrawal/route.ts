import { NextRequest, NextResponse } from 'next/server'
import { requireWorker } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createSchema = z.object({
  domainId:        z.string().min(1),
  symbol:          z.string().min(1).max(20),
  name:            z.string().min(1),
  network:         z.string().min(1),
  minWithdrawal:   z.number().min(0),
  maxWithdrawal:   z.number().min(0).optional().nullable(),
  fee:             z.number().min(0).default(0),
  feeType:         z.enum(['fixed', 'percent']).default('fixed'),
  isActive:        z.boolean().default(true),
  iconUrl:         z.string().url().optional().nullable(),
  contractAddress: z.string().optional().nullable(),
  decimals:        z.number().int().min(0).max(36).default(18),
})

export async function GET(req: NextRequest) {
  try {
    await requireWorker()

    const { searchParams } = new URL(req.url)
    const domainId = searchParams.get('domainId')

    // Only return domain-scoped currencies (domainId != null)
    const where = domainId
      ? { domainId }
      : { domainId: { not: null as string | null } }

    const data = await prisma.withdrawalCurrency.findMany({
      where,
      include: {
        domain: { select: { id: true, domain: true, name: true } },
        _count: { select: { withdrawals: true } },
      },
      orderBy: [{ domain: { domain: 'asc' } }, { symbol: 'asc' }],
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireWorker()

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid input' }, { status: 400 })

    const { domainId, symbol, name, network, minWithdrawal, maxWithdrawal, fee, feeType, isActive, iconUrl, contractAddress, decimals } = parsed.data

    // Verify domain exists
    const domain = await prisma.domain.findUnique({ where: { id: domainId } })
    if (!domain) return NextResponse.json({ error: 'Domain not found.' }, { status: 404 })

    const currency = await prisma.withdrawalCurrency.create({
      data: {
        symbol: symbol.toUpperCase(), name, network,
        minWithdrawal, maxWithdrawal: maxWithdrawal ?? null,
        fee, feeType, isActive,
        iconUrl: iconUrl ?? null,
        contractAddress: contractAddress ?? null, decimals,
        domainId,
      },
      include: { domain: { select: { id: true, domain: true, name: true } }, _count: { select: { withdrawals: true } } },
    })

    return NextResponse.json({ data: currency }, { status: 201 })
  } catch (err: any) {
    if (err?.code === 'P2002') return NextResponse.json({ error: 'Currency with this symbol already exists for this domain.' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to create currency.' }, { status: 500 })
  }
}
