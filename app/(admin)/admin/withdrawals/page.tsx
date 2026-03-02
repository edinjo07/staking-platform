import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-helpers'
import AdminWithdrawalsClient from './AdminWithdrawalsClient'

export const dynamic = 'force-dynamic'

export default async function AdminWithdrawalsPage() {
  await requireAdmin()

  const withdrawals = await prisma.withdrawal.findMany({
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

  return <AdminWithdrawalsClient withdrawals={withdrawals} />
}
