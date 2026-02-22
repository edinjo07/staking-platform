import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const session = await requireAuth()

  const stakes = await prisma.stake.findMany({
    where: { userId: session.user.id },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  })

  const active    = stakes.filter((s) => s.status === 'ACTIVE')
  const completed = stakes.filter((s) => s.status === 'COMPLETED')
  const others    = stakes.filter((s) => s.status !== 'ACTIVE' && s.status !== 'COMPLETED')

  // Default to first non-empty tab so users never land on a blank list
  const defaultTab =
    active.length > 0 ? 'active' :
    completed.length > 0 ? 'completed' :
    others.length > 0 ? 'other' : 'all'

  const totalInvested = stakes.reduce((s, k) => s + k.amount, 0)
  const totalEarned   = stakes.reduce((s, k) => s + k.totalEarned, 0)

  function StakeRow({ stake }: { stake: (typeof stakes)[0] }) {
    const now = new Date()
    const start = new Date(stake.startDate)
    const end = new Date(stake.endDate)
    const total = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    const progressPct = Math.min(100, Math.max(0, (elapsed / total) * 100))

    return (
      <Link href={`/orders/${stake.id}`} className="block hover:bg-secondary/30 rounded-lg transition-colors p-4 border border-border mb-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="font-medium">{stake.plan.name}</p>
            <p className="text-xs text-muted-foreground">{formatDate(stake.createdAt)}</p>
          </div>
          <Badge
            variant={
              stake.status === 'ACTIVE'    ? 'success' :
              stake.status === 'COMPLETED' ? 'info'    :
              stake.status === 'CANCELLED' ? 'error'   : 'warning'
            }
          >
            {stake.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm mb-3">
          <div>
            <p className="text-muted-foreground text-xs">Invested</p>
            <p className="font-medium">{formatCurrency(stake.amount, stake.currency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Expected Return</p>
            <p className="font-medium text-primary">{formatCurrency(stake.expectedReturn, stake.currency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">
              {stake.status === 'COMPLETED' ? 'Earned' : 'Paid Out'}
            </p>
            <p className="font-medium text-green-400">
              {formatCurrency(stake.totalEarned, stake.currency)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">ROI</p>
            <p className="font-medium">{stake.dailyRoi}% / day</p>
          </div>
        </div>

        {stake.status === 'ACTIVE' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progressPct)}% — Ends {formatDate(stake.endDate)}</span>
            </div>
            <Progress value={progressPct} className="h-1.5" />
          </div>
        )}

        {stake.status === 'COMPLETED' && (
          <div className="space-y-1">
            <Progress value={100} className="h-1.5" />
            <p className="text-xs text-green-400">Completed {formatDate(stake.endDate)}</p>
          </div>
        )}
      </Link>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">View and track all your staking positions.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Stakes',   value: stakes.length },
          { label: 'Active',         value: active.length },
          { label: 'Completed',      value: completed.length },
          { label: 'Total Invested', value: formatCurrency(totalInvested) },
          { label: 'Total Earned',   value: formatCurrency(totalEarned) },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          {others.length > 0 && (
            <TabsTrigger value="other">Other ({others.length})</TabsTrigger>
          )}
          <TabsTrigger value="all">All ({stakes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {active.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No active stakes. <Link href="/plans" className="text-primary hover:underline">Browse plans →</Link>
            </div>
          ) : (
            active.map((s) => <StakeRow key={s.id} stake={s} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completed.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No completed stakes yet.</div>
          ) : (
            completed.map((s) => <StakeRow key={s.id} stake={s} />)
          )}
        </TabsContent>

        {others.length > 0 && (
          <TabsContent value="other" className="mt-4">
            {others.map((s) => <StakeRow key={s.id} stake={s} />)}
          </TabsContent>
        )}

        <TabsContent value="all" className="mt-4">
          {stakes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No stakes yet. <Link href="/plans" className="text-primary hover:underline">Browse plans →</Link>
            </div>
          ) : (
            stakes.map((s) => <StakeRow key={s.id} stake={s} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
