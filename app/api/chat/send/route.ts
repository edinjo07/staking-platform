import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  content: z.string().max(2000).optional().default(''),
  imageUrl: z.string().url().optional(),
}).refine((d) => d.content.trim().length > 0 || !!d.imageUrl, {
  message: 'Message or image required.',
})

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Message or image required.' }, { status: 400 })
    }

    const msg = await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        content: parsed.data.content,
        isStaff: false,
        imageUrl: parsed.data.imageUrl ?? null,
        isRead: false,
      },
    })

    return NextResponse.json({ data: msg }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
