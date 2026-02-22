import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const ticket = await prisma.ticket.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!ticket) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    const messages = await prisma.ticketMessage.findMany({
      where: { ticketId: id },
      include: {
        user: { select: { username: true, firstName: true, avatar: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ data: messages })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

const schema = z.object({ message: z.string().min(1), imageUrl: z.string().optional() })

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid message.' }, { status: 400 })
    }

    const ticket = await prisma.ticket.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!ticket) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    if (ticket.status === 'CLOSED') {
      return NextResponse.json({ error: 'Ticket is closed.' }, { status: 400 })
    }

    const msg = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        userId: session.user.id,
        isStaff: false,
        content: parsed.data.message,
        imageUrl: parsed.data.imageUrl,
      },
      include: {
        user: { select: { username: true, firstName: true, avatar: true, role: true } },
      },
    })

    // Update ticket updatedAt
    await prisma.ticket.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ data: msg }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
