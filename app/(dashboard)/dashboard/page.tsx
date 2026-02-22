import { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { StatsCard } from '@/components/shared/StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  ArrowRight,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard' }

async function getDashboardData(userId: string) {
  const [user, stakes, deposits, withdrawals, notifications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true, firstName: true, lastName: true },
    }),
    prisma.stake.findMany({
      where: { userId },
      include: { plan: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.deposit.findMany({
      where: { userId },
      include: { currency: { select: { symbol: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.withdrawal.findMany({
      where: { userId },
      include: { currency: { select: { symbol: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  const activeStakes = stakes.filter((s) => s.status === 'ACTIVE')
  const totalStaked = activeStakes.reduce((sum, s) => sum + s.amount, 0)
  const totalEarned = stakes.reduce((sum, s) => sum + s.totalEarned, 0)
  const totalDeposited = deposits
    .filter((d) => d.status === 'CONFIRMED')
    .reduce((sum, d) => sum + d.amount, 0)

  return {
    user,
    stakes,
    deposits,
    withdrawals,
    notifications,
    activeStakes,
    totalStaked,
    totalEarned,
    totalDeposited,
  }
}

export default async function DashboardPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const data = await getDashboardData(session.user.id)
  const name = data.user?.firstName || session.user.name?.split(' ')[0] || 'User'

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Welcome back, {name}! 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here&#39;s what&#39;s happening with your portfolio today.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/deposit">
            <Button variant="gradient" size="sm" className="gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              Deposit
            </Button>
          </Link>
          <Link href="/plan/stake">
            <Button variant="secondary" size="sm" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Stake
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Balance"
          value={formatCurrency(data.user?.balance || 0)}
          icon={<DollarSign className="h-5 w-5" />}
          valueClassName="gradient-text"
        />
        <StatsCard
          title="Active Stakes"
          value={data.activeStakes.length.toString()}
          icon={<TrendingUp className="h-5 w-5" />}
          change={data.activeStakes.length > 0 ? 5 : undefined}
          changeLabel="vs. last week"
        />
        <StatsCard
          title="Total Staked"
          value={formatCurrency(data.totalStaked)}
          icon={<ArrowDownToLine className="h-5 w-5" />}
        />
        <StatsCard
          title="Total Earned"
          value={formatCurrency(data.totalEarned)}
          icon={<ArrowUpFromLine className="h-5 w-5" />}
          valueClassName="text-green-500"
          change={data.totalEarned > 0 ? 2.5 : undefined}
          changeLabel="this month"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Active Stakes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Active Stakes</CardTitle>
              <Link href="/orders">
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data.activeStakes.length === 0 ? (
                <div className="text-center py-10">
                  <TrendingUp className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No active stakes yet.</p>
                  <Link href="/plans">
                    <Button variant="gradient" size="sm">
                      Start Staking
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.activeStakes.map((stake) => {
                    const progress = Math.min(
                      100,
                      ((Date.now() - new Date(stake.startDate).getTime()) /
                        (new Date(stake.endDate).getTime() -
                          new Date(stake.startDate).getTime())) *
                        100
                    )
                    return (
                      <div
                        key={stake.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{stake.plan.name}</span>
                            <Badge variant="success" className="text-xs">Active</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            <span>{formatCurrency(stake.amount)} staked</span>
                            <span>+{stake.dailyRoi}%/day</span>
                            <span className="hidden sm:inline">Ends {formatDate(stake.endDate)}</span>
                          </div>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-sm font-semibold text-green-500">
                            +{formatCurrency(stake.totalEarned)}
                          </p>
                          <p className="text-xs text-muted-foreground">earned</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Notifications</CardTitle>
              <Link href="/notify">
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data.notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No new notifications.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.notifications.map((notif) => (
                    <div key={notif.id} className="p-3 rounded-lg bg-secondary/30">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(notif.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deposit History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Deposits</CardTitle>
            <Link href="/deposit">
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data.deposits.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No deposits yet.</p>
            ) : (
              <div className="space-y-2">
                {data.deposits.map((dep) => (
                  <div key={dep.id} className="flex justify-between items-center text-sm py-2 border-b border-border last:border-0">
                    <div>
                      <span className="font-medium">{dep.amount} {dep.currency.symbol}</span>
                      <p className="text-xs text-muted-foreground">{formatDate(dep.createdAt)}</p>
                    </div>
                    <Badge variant={dep.status === 'CONFIRMED' ? 'success' : dep.status === 'FAILED' ? 'error' : 'warning'} className="text-xs">
                      {dep.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Withdrawals</CardTitle>
            <Link href="/withdraw">
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data.withdrawals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No withdrawals yet.</p>
            ) : (
              <div className="space-y-2">
                {data.withdrawals.map((wd) => (
                  <div key={wd.id} className="flex justify-between items-center text-sm py-2 border-b border-border last:border-0">
                    <div>
                      <span className="font-medium">{wd.amount} {wd.currency.symbol}</span>
                      <p className="text-xs text-muted-foreground">{formatDate(wd.createdAt)}</p>
                    </div>
                    <Badge
                      variant={
                        wd.status === 'COMPLETED' || wd.status === 'APPROVED' ? 'success' :
                        wd.status === 'REJECTED' ? 'error' : 'warning'
                      }
                      className="text-xs"
                    >
                      {wd.status}
                    </Badge>
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
