import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  symbol:          z.string().min(1).max(20).optional(),
  name:            z.string().min(1).optional(),
  network:         z.string().min(1).optional(),
  minDeposit:      z.number().min(0).optional(),
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

    const { symbol, name, network, minDeposit, isActive, iconUrl, contractAddress, decimals } = parsed.data
    const currency = await prisma.depositCurrency.update({
      where: { id },
      data: {
        ...(symbol          !== undefined && { symbol: symbol.toUpperCase() }),
        ...(name            !== undefined && { name }),
        ...(network         !== undefined && { network }),
        ...(minDeposit      !== undefined && { minDeposit }),
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

    const depositCount = await prisma.deposit.count({ where: { currencyId: id } })
    if (depositCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${depositCount} deposit(s) reference this currency.` },
        { status: 409 }
      )
    }

    await prisma.depositCurrency.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.code === 'P2025') return NextResponse.json({ error: 'Currency not found.' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to delete currency.' }, { status: 500 })
  }
}
