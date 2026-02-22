import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  await requireAdmin()
  const { userId } = await params

  const data = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    take: 200,
  })

  // Mark user messages as read
  await prisma.chatMessage.updateMany({
    where: { userId, isStaff: false, isRead: false },
    data: { isRead: true },
  })

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  await requireAdmin()

  const { userId } = await params
  const { message } = await req.json()

  if (!message?.trim()) return NextResponse.json({ error: 'Message required.' }, { status: 400 })

  const msg = await prisma.chatMessage.create({
    data: {
      userId,
      content: message.trim(),
      isStaff: true,
      isRead: false,
    },
  })

  // Send notification to user
  await prisma.notification.create({
    data: {
      userId,
      type: 'SYSTEM',
      title: 'New message from support',
      message: message.trim().slice(0, 100),
    },
  })

  return NextResponse.json({ data: msg }, { status: 201 })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  await requireAdmin()

  const { userId } = await params

  await prisma.chatMessage.deleteMany({ where: { userId } })

  return NextResponse.json({ success: true })
}
