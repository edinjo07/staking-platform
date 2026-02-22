import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await requireAuth()
    const wallets = await prisma.savedWallet.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: wallets })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { label, address, network, currency } = await req.json()
    if (!address?.trim() || !network?.trim()) {
      return NextResponse.json({ error: 'Address and network required.' }, { status: 400 })
    }

    const count = await prisma.savedWallet.count({ where: { userId: session.user.id } })
    if (count >= 10) {
      return NextResponse.json({ error: 'Maximum 10 saved wallets.' }, { status: 400 })
    }

    const wallet = await prisma.savedWallet.create({
      data: {
        userId: session.user.id,
        label: label?.trim() || null,
        address: address.trim(),
        network: network.trim(),
        currency: currency?.trim() || null,
      },
    })
    return NextResponse.json({ data: wallet }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
