import { NextRequest, NextResponse } from 'next/server'
import { requireSupport } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// GET /api/support/settings/telegram — get caller's telegramChatId
export async function GET() {
  const session = await requireSupport()

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, telegramChatId: true },
  })

  return NextResponse.json({ telegramChatId: me?.telegramChatId ?? null })
}

// PATCH /api/support/settings/telegram — update caller's telegramChatId
export async function PATCH(req: NextRequest) {
  const session = await requireSupport()

  const { telegramChatId } = await req.json()

  // Allow clearing (null / empty string)
  const value = telegramChatId?.toString().trim() || null

  await prisma.user.update({
    where: { id: session.user.id },
    data: { telegramChatId: value },
  })

  return NextResponse.json({ success: true })
}
