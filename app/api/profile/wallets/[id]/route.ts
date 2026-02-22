import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const wallet = await prisma.savedWallet.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!wallet) return NextResponse.json({ error: 'Wallet not found.' }, { status: 404 })

    await prisma.savedWallet.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
