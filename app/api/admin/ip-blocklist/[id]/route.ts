import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  await prisma.ipBlocklist.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
