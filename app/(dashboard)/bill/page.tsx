import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { ArrowUpRight, ArrowDownLeft, DollarSign, Activity } from 'lucide-react'

export const dynamic = 'force-dynamic'

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; sign: string }> = {
  DEPOSIT: { label: 'Deposit', icon: ArrowDownLeft, color: 'text-green-400', sign: '+' },
  WITHDRAWAL: { label: 'Withdrawal', icon: ArrowUpRight, color: 'text-red-400', sign: '-' },
  STAKING: { label: 'Staking', icon: DollarSign, color: 'text-blue-400', sign: '-' },
  STAKING_RETURN: { label: 'Staking Return', icon: DollarSign, color: 'text-primary', sign: '+' },
  REFERRAL_BONUS: { label: 'Referral Bonus', icon: DollarSign, color: 'text-purple-400', sign: '+' },
  FEE: { label: 'Fee', icon: Activity, color: 'text-yellow-400', sign: '-' },
}

export default async function BillPage() {
  const session = await requireAuth()

  const [transactions, totalCount] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.transaction.count({ where: { userId: session.user.id } }),
  ])

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <p className="text-muted-foreground text-sm mt-1">All your account transactions.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No transactions yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx) => {
                const cfg = typeConfig[tx.type] || {
                  label: tx.type,
                  icon: Activity,
                  color: 'text-muted-foreground',
                  sign: '',
                }
                const Icon = cfg.icon
                return (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors">
                    <div className={`rounded-lg bg-secondary/40 p-2 ${cfg.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{cfg.label}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</p>
                      {tx.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{tx.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${cfg.color}`}>
                        {cfg.sign}{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge
                        variant={
                          tx.status === 'COMPLETED' ? 'success' :
                          tx.status === 'FAILED' ? 'error' : 'warning'
                        }
                        className="text-xs mt-1"
                      >
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {totalCount > 200 && (
        <p className="text-xs text-center text-muted-foreground">
          Showing 200 most recent transactions of {totalCount} total.
        </p>
      )}
    </div>
  )
}
