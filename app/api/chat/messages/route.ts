import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor')
    const limit = 30

    const messages = await prisma.chatMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: limit,
    })

    return NextResponse.json({ data: messages })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
