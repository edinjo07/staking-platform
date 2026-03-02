import { NextRequest, NextResponse } from 'next/server'
import { requireSupport } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

async function getCallerDomainId(callerId: string) {
  const me = await prisma.user.findUnique({ where: { id: callerId }, select: { domainId: true } })
  return me?.domainId ?? null
}

// PATCH /api/support/settings/quick-replies/[id] — update title/content
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSupport()
  const domainId = await getCallerDomainId(session.user.id)
  if (!domainId) return NextResponse.json({ error: 'No domain assigned.' }, { status: 403 })
  const { id } = await params

  const qr = await prisma.quickReply.findUnique({ where: { id } })
  if (!qr) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  if (qr.domainId !== domainId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  const { title, content } = await req.json()
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 })
  }

  const updated = await prisma.quickReply.update({
    where: { id },
    data: { title: title.trim(), content: content.trim() },
  })

  return NextResponse.json({ data: updated })
}

// DELETE /api/support/settings/quick-replies/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSupport()
  const domainId = await getCallerDomainId(session.user.id)
  if (!domainId) return NextResponse.json({ error: 'No domain assigned.' }, { status: 403 })
  const { id } = await params

  const qr = await prisma.quickReply.findUnique({ where: { id } })
  if (!qr) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  if (qr.domainId !== domainId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  await prisma.quickReply.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
