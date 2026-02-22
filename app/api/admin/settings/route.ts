import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET() {
  await requireAdmin()

  const data = await prisma.siteSetting.findMany({ orderBy: { key: 'asc' } })
  return NextResponse.json({ data })
}

export async function PUT(req: NextRequest) {
  await requireAdmin()

  const { settings } = await req.json()
  if (!Array.isArray(settings)) return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })

  await Promise.all(
    settings.map((s: { key: string; value: string }) =>
      prisma.siteSetting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value }
      })
    )
  )

  return NextResponse.json({ success: true })
}
