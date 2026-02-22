import { NextRequest, NextResponse } from 'next/server'
import { requireSupport } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

async function getCallerDomainId(callerId: string) {
  const me = await prisma.user.findUnique({ where: { id: callerId }, select: { domainId: true } })
  return me?.domainId ?? null
}

// GET /api/support/settings/quick-replies — list quick replies for caller's domain
export async function GET() {
  const session = await requireSupport()
  const domainId = await getCallerDomainId(session.user.id)
  if (!domainId) return NextResponse.json({ error: 'No domain assigned.' }, { status: 403 })

  const data = await prisma.quickReply.findMany({
    where: { domainId },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ data })
}

// POST /api/support/settings/quick-replies — create a new quick reply
export async function POST(req: NextRequest) {
  const session = await requireSupport()
  const domainId = await getCallerDomainId(session.user.id)
  if (!domainId) return NextResponse.json({ error: 'No domain assigned.' }, { status: 403 })

  const { title, content } = await req.json()
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 })
  }

  const qr = await prisma.quickReply.create({
    data: { title: title.trim(), content: content.trim(), domainId },
  })

  return NextResponse.json({ data: qr }, { status: 201 })
}
