import { NextRequest, NextResponse } from 'next/server'
import { requireWorker } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// PATCH /api/worker/users/:id/role
// Body: { role: 'USER' | 'SUPPORT' }
// Workers can only grant/revoke the SUPPORT role on users within their own domain.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireWorker()
    const { id } = await params

    // Resolve caller's domain
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { domainId: true },
    })
    const callerDomainId = me?.domainId ?? null

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, domainId: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    if (user.role === 'ADMIN') {
      return NextResponse.json({ error: 'Cannot change role of admin accounts.' }, { status: 403 })
    }

    // Domain guard: workers can only manage users within their own domain
    if (callerDomainId && user.domainId !== callerDomainId) {
      return NextResponse.json({ error: 'Forbidden: user belongs to a different domain.' }, { status: 403 })
    }

    const { role } = await req.json()
    if (!['USER', 'SUPPORT'].includes(role)) {
      return NextResponse.json({ error: 'Role must be USER or SUPPORT.' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, role: true },
    })

    return NextResponse.json({ data: updated })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
