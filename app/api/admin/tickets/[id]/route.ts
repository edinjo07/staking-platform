import { NextRequest, NextResponse } from 'next/server'
import { requireSupport } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSupport()
    const { id } = await params

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, username: true, firstName: true, lastName: true, avatar: true } },
        messages: {
          include: {
            user: { select: { id: true, username: true, firstName: true, avatar: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!ticket) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    return NextResponse.json({ data: ticket })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSupport()
    const { id } = await params
    const { status } = await req.json()

    const allowed = ['OPEN', 'IN_PROGRESS', 'CLOSED']
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: { status },
    })
    return NextResponse.json({ data: ticket })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSupport()
    const { id } = await params
    const { message } = await req.json()

    if (!message?.trim()) return NextResponse.json({ error: 'Message required.' }, { status: 400 })

    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    if (ticket.status === 'CLOSED') return NextResponse.json({ error: 'Ticket is closed.' }, { status: 400 })

    const msg = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        userId: session.user.id,
        isStaff: true,
        content: message.trim(),
      },
      include: {
        user: { select: { id: true, username: true, firstName: true, avatar: true, role: true } },
      },
    })

    // Update ticket status to IN_PROGRESS if it was OPEN
    if (ticket.status === 'OPEN') {
      await prisma.ticket.update({ where: { id }, data: { status: 'IN_PROGRESS' } })
    }

    // Notify the user
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        type: 'SYSTEM',
        title: 'Support replied to your ticket',
        message: `Your ticket "${ticket.subject}" has a new reply.`,
      },
    })

    return NextResponse.json({ data: msg }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
