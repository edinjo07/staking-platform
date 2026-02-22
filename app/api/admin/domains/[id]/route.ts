import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const body = await req.json()
  const { isActive, name, logoUrl, supportEmail } = body

  const data: Record<string, unknown> = {}
  if (isActive !== undefined) data.isActive = isActive
  if (name !== undefined) data.name = name?.trim() || null
  if (logoUrl !== undefined) data.logoUrl = logoUrl?.trim() || null
  if (supportEmail !== undefined) data.supportEmail = supportEmail?.trim() || null

  const domain = await prisma.domain.update({ where: { id }, data })
  return NextResponse.json({ data: domain })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  await prisma.domain.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
