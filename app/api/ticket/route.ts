import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  subject: z.string().min(3).max(200),
  category: z.string(),
  message: z.string().min(5),
})

export async function GET() {
  try {
    const session = await requireAuth()
    const tickets = await prisma.ticket.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { messages: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ data: tickets })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const ticket = await prisma.ticket.create({
      data: {
        userId: session.user.id,
        subject: parsed.data.subject,
        category: parsed.data.category,
        status: 'OPEN',
        messages: {
          create: {
            userId: session.user.id,
            isStaff: false,
            content: parsed.data.message,
          },
        },
      },
      include: { _count: { select: { messages: true } } },
    })

    return NextResponse.json({ data: ticket }, { status: 201 })
  } catch (error) {
    console.error('[TICKET_CREATE]', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
