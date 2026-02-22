import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  symbol:          z.string().min(1).max(20).optional(),
  name:            z.string().min(1).optional(),
  network:         z.string().min(1).optional(),
  minWithdrawal:   z.number().min(0).optional(),
  maxWithdrawal:   z.number().min(0).optional().nullable(),
  fee:             z.number().min(0).optional(),
  feeType:         z.enum(['fixed', 'percent']).optional(),
  isActive:        z.boolean().optional(),
  iconUrl:         z.string().url().optional().nullable(),
  contractAddress: z.string().optional().nullable(),
  decimals:        z.number().int().min(0).max(36).optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid input' }, { status: 400 })

    const { symbol, name, network, minWithdrawal, maxWithdrawal, fee, feeType, isActive, iconUrl, contractAddress, decimals } = parsed.data
    const currency = await prisma.withdrawalCurrency.update({
      where: { id },
      data: {
        ...(symbol          !== undefined && { symbol: symbol.toUpperCase() }),
        ...(name            !== undefined && { name }),
        ...(network         !== undefined && { network }),
        ...(minWithdrawal   !== undefined && { minWithdrawal }),
        ...(maxWithdrawal   !== undefined && { maxWithdrawal: maxWithdrawal ?? null }),
        ...(fee             !== undefined && { fee }),
        ...(feeType         !== undefined && { feeType }),
        ...(isActive        !== undefined && { isActive }),
        ...(iconUrl         !== undefined && { iconUrl: iconUrl ?? null }),
        ...(contractAddress !== undefined && { contractAddress: contractAddress ?? null }),
        ...(decimals        !== undefined && { decimals }),
      },
    })
    return NextResponse.json({ data: currency })
  } catch (err: any) {
    if (err?.code === 'P2025') return NextResponse.json({ error: 'Currency not found.' }, { status: 404 })
    if (err?.code === 'P2002') return NextResponse.json({ error: 'Symbol already in use.' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to update currency.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params

    const withdrawalCount = await prisma.withdrawal.count({ where: { currencyId: id } })
    if (withdrawalCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${withdrawalCount} withdrawal(s) reference this currency.` },
        { status: 409 }
      )
    }

    await prisma.withdrawalCurrency.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === 'P2025') return NextResponse.json({ error: 'Currency not found.' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to delete currency.' }, { status: 500 })
  }
}
