import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await requireAuth()
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true },
    })
    return NextResponse.json({ data: { balance: user?.balance || 0 } })
  } catch (error) {
    console.error('[WITHDRAW_BALANCE]', error)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
