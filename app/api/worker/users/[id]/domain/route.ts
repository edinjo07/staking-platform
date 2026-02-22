import { NextRequest, NextResponse } from 'next/server'
import { requireWorker } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireWorker()
    const { id } = await params
    const { domainId } = await req.json()

    // Resolve caller's domain
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { domainId: true },
    })
    const callerDomainId = me?.domainId ?? null

    // Workers (with a domainId) cannot reassign users between domains — admin only
    if (callerDomainId) {
      return NextResponse.json({ error: 'Forbidden: only administrators can reassign domain membership.' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } })
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    // Validate target domain exists (if not null)
    if (domainId) {
      const domain = await prisma.domain.findUnique({ where: { id: domainId } })
      if (!domain) return NextResponse.json({ error: 'Domain not found.' }, { status: 404 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { domainId: domainId || null },
      select: { id: true, domainId: true, domain: { select: { domain: true, name: true } } },
    })

    return NextResponse.json({ data: updated })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
