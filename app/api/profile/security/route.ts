import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await requireAuth()
    const [user, loginHistory] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { twoFaEnabled: true, pinEnabled: true },
      }),
      prisma.loginHistory.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])
    return NextResponse.json({
      data: {
        twoFaEnabled: user?.twoFaEnabled || false,
        pinEnabled: user?.pinEnabled || false,
        loginHistory,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
