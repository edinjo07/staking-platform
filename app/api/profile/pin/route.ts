import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  pin: z.string().length(4).regex(/^\d{4}$/),
  currentPin: z.string().length(4).regex(/^\d{4}$/).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'PIN must be 4 digits.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    // If PIN is already set, require current PIN to change it
    if (user.pinEnabled && user.pin) {
      if (!parsed.data.currentPin) {
        return NextResponse.json({ error: 'Current PIN is required to change your PIN.' }, { status: 400 })
      }
      const currentValid = await bcrypt.compare(parsed.data.currentPin, user.pin)
      if (!currentValid) {
        return NextResponse.json({ error: 'Current PIN is incorrect.' }, { status: 400 })
      }
      // New PIN must differ from current
      const isSame = await bcrypt.compare(parsed.data.pin, user.pin)
      if (isSame) {
        return NextResponse.json({ error: 'New PIN must be different from your current PIN.' }, { status: 400 })
      }
    }

    const pinHash = await bcrypt.hash(parsed.data.pin, 12)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { pin: pinHash, pinEnabled: true },
    })

    return NextResponse.json({ message: 'PIN set successfully.' })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[PIN_SET]', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
