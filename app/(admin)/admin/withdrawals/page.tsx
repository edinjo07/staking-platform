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


  const pending = withdrawals.filter((w) => w.status === 'PENDING')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Withdrawals</h1>
        <Badge variant="warning">{pending.length} Pending</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Net</th>
                  <th className="text-left px-4 py-3 font-medium">Currency</th>
                  <th className="text-left px-4 py-3 font-medium">Wallet</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{w.user.username || w.user.email}</p>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(w.amount)}</td>
                    <td className="px-4 py-3 text-primary font-medium">{formatCurrency(w.netAmount)}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p>{w.currency.symbol}</p>
                        <p className="text-xs text-muted-foreground">{w.currency.network}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs max-w-xs truncate">{w.walletAddress}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          w.status === 'COMPLETED' ? 'success' :
                          w.status === 'REJECTED' || w.status === 'FAILED' ? 'error' : 'warning'
                        }
                        className="text-xs"
                      >
                        {w.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(w.createdAt)}</td>
                    <td className="px-4 py-3">
                      {w.status === 'PENDING' && <AdminWithdrawalActions withdrawalId={w.id} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
