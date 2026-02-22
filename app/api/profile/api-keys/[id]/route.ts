import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const key = await prisma.apiKey.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!key) return NextResponse.json({ error: 'API key not found.' }, { status: 404 })

    await prisma.apiKey.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const key = await prisma.apiKey.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!key) return NextResponse.json({ error: 'API key not found.' }, { status: 404 })

    const updated = await prisma.apiKey.update({
      where: { id },
      data: { isActive: !key.isActive },
      select: { id: true, isActive: true },
    })
    return NextResponse.json({ data: updated })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
