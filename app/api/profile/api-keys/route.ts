import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import crypto from 'crypto'

const PERMISSIONS = ['READ', 'WITHDRAW', 'STAKING'] as const

const createSchema = z.object({
  name: z.string().min(1).max(60),
  permissions: z.array(z.enum(PERMISSIONS)).min(1),
  expiresAt: z.string().datetime().optional(),
})

export async function GET() {
  try {
    const session = await requireAuth()
    const keys = await prisma.apiKey.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        // Return only the first 8 chars of the key as a display prefix
        key: true,
        permissions: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    })

    // Mask the key: show prefix + masked suffix
    const masked = keys.map((k) => ({
      ...k,
      keyPrefix: k.key.slice(0, 10) + '••••••••••••••••',
    }))

    return NextResponse.json({ data: masked })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    // Limit per user
    const count = await prisma.apiKey.count({ where: { userId: session.user.id } })
    if (count >= 10) {
      return NextResponse.json({ error: 'Maximum 10 API keys per account.' }, { status: 400 })
    }

    // Generate a secure key: sp_live_<32 random hex bytes>
    const rawKey = `sp_live_${crypto.randomBytes(32).toString('hex')}`

    const key = await prisma.apiKey.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name.trim(),
        key: rawKey,
        permissions: parsed.data.permissions,
        isActive: true,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      },
    })

    // Return the full key ONCE — never returned again
    return NextResponse.json(
      {
        data: {
          id: key.id,
          name: key.name,
          key: key.key,
          permissions: key.permissions,
          isActive: key.isActive,
          expiresAt: key.expiresAt,
          createdAt: key.createdAt,
        },
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
