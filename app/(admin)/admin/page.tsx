import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import {
  Users, DollarSign, TrendingUp, ArrowUpFromLine,
  ArrowDownToLine, Activity, Layers, Clock,
} from 'lucide-react'
import { AdminCharts, type DailyChartPoint } from '@/components/admin/AdminCharts'

export const dynamic = 'force-dynamic'

// Build a YYYY-MM-DD key in UTC
function dayKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

// Short label: "Mon 17"
function shortLabel(isoDate: string) {
  const d = new Date(isoDate + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', timeZone: 'UTC' })
}

export default async function AdminDashboard() {
  // Layout already enforces admin — no need to call requireAdmin() again here

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    activeStakes,
    completedStakes,
    totalDeposited,
    totalWithdrawn,
    pendingWithdrawals,
    pendingDeposits,
    totalStakedAmount,
    feeRevenue,
    stakingPayouts,
    recentUsers,
    recentWithdrawals,
    // 7-day growth data
    newUsers7d,
    newDeposits7d,
    newWithdrawals7d,
    newStakes7d,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.stake.count({ where: { status: 'ACTIVE' } }),
    prisma.stake.count({ where: { status: 'COMPLETED' } }),
    prisma.deposit.aggregate({ where: { status: 'CONFIRMED' }, _sum: { amount: true } }),
    prisma.withdrawal.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.withdrawal.count({ where: { status: 'PENDING' } }),
    prisma.deposit.count({ where: { status: 'PENDING' } }),
    prisma.stake.aggregate({ where: { status: 'ACTIVE' }, _sum: { amount: true } }),
    // Real fee revenue: sum of fees collected on completed withdrawals
    prisma.withdrawal.aggregate({ where: { status: 'COMPLETED' }, _sum: { fee: true } }),
    // Total paid out to stakers
    prisma.transaction.aggregate({
      where: { type: 'STAKING_RETURN', status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, username: true, createdAt: true, balance: true },
    }),
    prisma.withdrawal.findMany({
      where: { status: 'PENDING' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, username: true } },
        currency: { select: { symbol: true } },
      },
    }),
    // 7-day growth raw records
    prisma.user.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.deposit.findMany({
      where: { status: 'CONFIRMED', createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, amount: true },
    }),
    prisma.withdrawal.findMany({
      where: { status: 'COMPLETED', createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, amount: true },
    }),
    prisma.stake.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
  ])

  // Build 7-day chart data
  const days: Record<string, { users: number; deposits: number; withdrawals: number; stakes: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const k = dayKey(new Date(Date.now() - i * 24 * 60 * 60 * 1000))
    days[k] = { users: 0, deposits: 0, withdrawals: 0, stakes: 0 }
  }
  for (const u of newUsers7d) { const k = dayKey(u.createdAt); if (days[k]) days[k].users++ }
  for (const d of newDeposits7d) { const k = dayKey(d.createdAt); if (days[k]) days[k].deposits += d.amount }
  for (const w of newWithdrawals7d) { const k = dayKey(w.createdAt); if (days[k]) days[k].withdrawals += w.amount }
  for (const s of newStakes7d) { const k = dayKey(s.createdAt); if (days[k]) days[k].stakes++ }

  const chartData: DailyChartPoint[] = Object.entries(days).map(([date, vals]) => ({
    date: shortLabel(date),
    users: vals.users,
    deposits: Math.round(vals.deposits * 100) / 100,
    withdrawals: Math.round(vals.withdrawals * 100) / 100,
    stakes: vals.stakes,
  }))

  const stats = [
    { label: 'Total Users',        value: totalUsers,                                          icon: Users,           color: 'text-blue-400' },
    { label: 'Active Stakes',      value: activeStakes,                                        icon: TrendingUp,      color: 'text-primary' },
    { label: 'Completed Stakes',   value: completedStakes,                                     icon: Layers,          color: 'text-emerald-400' },
    { label: 'Total Deposited',    value: formatCurrency(totalDeposited._sum.amount ?? 0),     icon: ArrowDownToLine, color: 'text-green-400' },
    { label: 'Total Withdrawn',    value: formatCurrency(totalWithdrawn._sum.amount ?? 0),     icon: ArrowUpFromLine, color: 'text-red-400' },
    { label: 'Total Staked',       value: formatCurrency(totalStakedAmount._sum.amount ?? 0),  icon: DollarSign,      color: 'text-amber-400' },
    { label: 'Staking Payouts',    value: formatCurrency(stakingPayouts._sum.amount ?? 0),     icon: ArrowUpFromLine, color: 'text-orange-400' },
    { label: 'Fee Revenue',        value: formatCurrency(feeRevenue._sum.fee ?? 0),            icon: DollarSign,      color: 'text-purple-400' },
    { label: 'Pending Withdrawals',value: pendingWithdrawals,                                  icon: Activity,        color: 'text-yellow-400' },
    { label: 'Pending Deposits',   value: pendingDeposits,                                     icon: Clock,           color: 'text-sky-400' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5 flex items-center gap-3">
              <div className={`rounded-xl bg-secondary/40 p-3 flex-shrink-0 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                <p className="text-lg font-bold leading-tight">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Growth Charts ── */}
      <AdminCharts data={chartData} />

      {/* ── Recent Activity ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Signups</CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No users yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {recentUsers.map((u) => (
                  <div key={u.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{u.username || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <p className="text-sm font-medium">{formatCurrency(u.balance)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Pending Withdrawals ({pendingWithdrawals})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentWithdrawals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No pending withdrawals.</p>
            ) : (
              <div className="divide-y divide-border">
                {recentWithdrawals.map((w) => (
                  <div key={w.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{w.user.username || w.user.email}</p>
                      <p className="text-xs text-muted-foreground">{w.currency.symbol}</p>
                    </div>
                    <p className="text-sm font-semibold text-primary">{formatCurrency(w.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
