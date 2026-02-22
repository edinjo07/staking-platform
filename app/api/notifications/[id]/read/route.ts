import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const notification = await prisma.notification.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }

    if (notification.isRead) {
      return NextResponse.json({ message: 'Already read.' })
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    })

    return NextResponse.json({ message: 'Marked as read.' })
  } catch {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
}
