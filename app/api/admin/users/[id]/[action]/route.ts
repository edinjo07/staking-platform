import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; action: string }> }) {
  try {
    await requireAdmin()
    const { id: userId, action } = await params
    const body = await req.json().catch(() => ({}))

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

    switch (action) {
      case 'ban':
        await prisma.user.update({ where: { id: userId }, data: { bannedAt: new Date(), isActive: false } })
        return NextResponse.json({ message: 'User banned.' })

      case 'unban':
        await prisma.user.update({ where: { id: userId }, data: { bannedAt: null, isActive: true } })
        return NextResponse.json({ message: 'User unbanned.' })

      case 'toggle-active':
        await prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } })
        return NextResponse.json({ message: `User ${user.isActive ? 'deactivated' : 'activated'}.` })

      case 'adjust-balance': {
        const amount = parseFloat(body.amount)
        if (isNaN(amount)) return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 })
        await prisma.user.update({ where: { id: userId }, data: { balance: { increment: amount } } })
        await prisma.transaction.create({
          data: {
            userId,
            type: amount > 0 ? 'DEPOSIT' : 'WITHDRAWAL',
            amount: Math.abs(amount),
            status: 'COMPLETED',
            description: `Admin balance adjustment: ${amount > 0 ? '+' : ''}${amount}`,
          },
        })
        return NextResponse.json({ message: `Balance adjusted by $${amount}.` })
      }

      case 'change-role': {
        const allowed = ['USER', 'SUPPORT', 'WORKER', 'ADMIN']
        const role = String(body.role || '')
        if (!allowed.includes(role)) return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
        await prisma.user.update({ where: { id: userId }, data: { role } })
        return NextResponse.json({ message: `Role changed to ${role}.` })
      }

      default:
        return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized or server error.' }, { status: 500 })
  }
}
