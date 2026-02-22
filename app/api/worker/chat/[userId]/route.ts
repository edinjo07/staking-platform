import { NextRequest, NextResponse } from 'next/server'
import { requireSupport } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// Verify the target userId is accessible by the caller:
// - target must belong to a domain
// - if the caller has a domainId (agent), target must be in the same domain
async function verifyAccess(callerId: string, targetUserId: string): Promise<boolean> {
  const [caller, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: callerId }, select: { domainId: true } }),
    prisma.user.findUnique({ where: { id: targetUserId }, select: { domainId: true } }),
  ])
  if (!target?.domainId) return false          // target must be domain-scoped
  if (!caller?.domainId) return true            // admin (no domain) can access all
  return caller.domainId === target.domainId   // agent can only access own domain
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireSupport()
    const { userId } = await params

    if (!(await verifyAccess(session.user.id, userId))) {
      return NextResponse.json({ error: 'User not found or access denied.' }, { status: 403 })
    }

    const data = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 200,
    })

    await prisma.chatMessage.updateMany({
      where: { userId, isStaff: false, isRead: false },
      data: { isRead: true },
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[worker/chat/[userId] GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireSupport()
    const { userId } = await params

    if (!(await verifyAccess(session.user.id, userId))) {
      return NextResponse.json({ error: 'User not found or access denied.' }, { status: 403 })
    }

    const { message } = await req.json()
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required.' }, { status: 400 })
    }

    const msg = await prisma.chatMessage.create({
      data: {
        userId,
        content: message.trim(),
        isStaff: true,
        isRead: false,
      },
    })

    await prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: 'New message from support',
        message: message.trim().slice(0, 100),
      },
    })

    return NextResponse.json({ data: msg }, { status: 201 })
  } catch (error) {
    console.error('[worker/chat/[userId] POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireSupport()
    const { userId } = await params

    if (!(await verifyAccess(session.user.id, userId))) {
      return NextResponse.json({ error: 'User not found or access denied.' }, { status: 403 })
    }

    await prisma.chatMessage.deleteMany({ where: { userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[worker/chat/[userId] DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
