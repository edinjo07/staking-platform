import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-helpers'
import AdminDepositsClient from './AdminDepositsClient'

export const dynamic = 'force-dynamic'

export default async function AdminDepositsPage() {
  await requireAdmin()

  const deposits = await prisma.deposit.findMany({
    include: {
      user: {
        select: {
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          domain: { select: { id: true, domain: true, name: true } },
        },
      },
      currency: { select: { symbol: true, network: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  return <AdminDepositsClient deposits={deposits} />
}
