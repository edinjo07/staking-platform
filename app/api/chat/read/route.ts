import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// Mark all staff messages as read for the authenticated user
export async function PATCH() {
  try {
    const session = await requireAuth()

    await prisma.chatMessage.updateMany({
      where: { userId: session.user.id, isStaff: true, isRead: false },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
