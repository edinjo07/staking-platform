import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Clock, DollarSign, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  const { id } = await params

  const stake = await prisma.stake.findFirst({
    where: { id, userId: session.user.id },
    include: {
      plan: true,
      payments: { orderBy: { date: 'desc' } },
    },
  })

  if (!stake) notFound()

  const now = new Date()
  const start = new Date(stake.startDate)
  const end = new Date(stake.endDate)
  const total = end.getTime() - start.getTime()
  const elapsed = now.getTime() - start.getTime()
  const progressPct = Math.min(100, Math.max(0, (elapsed / total) * 100))
  // Use stake.totalEarned as the authoritative amount credited to the user's balance
  const earnedSoFar = stake.totalEarned
  // payments are ordered date desc; day number = (total payments) - index
  const totalPayments = stake.payments.length
  const remaining = Math.max(0, stake.expectedReturn - earnedSoFar)
  // 1-indexed current day (Day 1 on start day, clamped to plan duration)
  const daysElapsed = Math.min(
    stake.plan.durationDays,
    Math.max(1, Math.floor(elapsed / (24 * 60 * 60 * 1000)) + 1),
  )
  const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
  // Running totals for payment history (payments sorted desc, so accumulate from the end)
  const paymentsAsc = [...stake.payments].reverse()
  const runningTotals = paymentsAsc.reduce<number[]>((acc, p) => {
    acc.push((acc[acc.length - 1] ?? 0) + p.amount)
    return acc
  }, [])
  // Reverse back so index matches the original desc-sorted payments array
  const runningTotalsDesc = [...runningTotals].reverse()

  const statusVariant =
    stake.status === 'ACTIVE' ? 'success' :
    stake.status === 'COMPLETED' ? 'info' :
    stake.status === 'CANCELLED' ? 'error' : 'warning'

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/orders" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-muted-foreground text-xs font-mono mt-0.5">{stake.id}</p>
        </div>
      </div>

      {/* Status card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-muted-foreground text-sm">Plan</p>
              <p className="text-lg font-bold">{stake.plan.name}</p>
            </div>
            <Badge variant={statusVariant} className="text-sm px-3 py-1">
              {stake.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-lg bg-secondary/30 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <DollarSign className="h-3 w-3" /> Invested
              </p>
              <p className="font-bold">{formatCurrency(stake.amount, stake.currency)}</p>
            </div>
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3" /> Total Return
              </p>
              <p className="font-bold text-primary">{formatCurrency(stake.expectedReturn, stake.currency)}</p>
            </div>
            <div className="rounded-lg bg-secondary/30 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <CheckCircle2 className="h-3 w-3" /> Paid Out
              </p>
              <p className="font-bold text-green-400">{formatCurrency(earnedSoFar, stake.currency)}</p>
            </div>
            <div className="rounded-lg bg-secondary/30 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Clock className="h-3 w-3" /> Remaining
              </p>
              <p className="font-bold">{formatCurrency(remaining, stake.currency)}</p>
            </div>
          </div>

          {stake.status === 'ACTIVE' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress — Day {daysElapsed} of {stake.plan.durationDays}</span>
                <span>{Math.round(progressPct)}%</span>
              </div>
              <Progress value={progressPct} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Started: {formatDate(start)}</span>
                <span>Ends: {formatDate(end)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {totalPayments} of {stake.plan.durationDays} payment{stake.plan.durationDays !== 1 ? 's' : ''} made
                </span>
                <span className="text-yellow-400 font-medium">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining</span>
              </div>
              {stake.nextProcessAt && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                  <Clock className="h-3 w-3" /> Next payment: {formatDateTime(stake.nextProcessAt)}
                </p>
              )}
            </div>
          )}

          {stake.status === 'COMPLETED' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress — {stake.plan.durationDays} of {stake.plan.durationDays} payments</span>
                <span>100%</span>
              </div>
              <Progress value={100} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Started: {formatDate(start)}</span>
                <span className="flex items-center gap-1 text-green-400">
                  <CheckCircle2 className="h-3 w-3" /> Completed: {formatDate(end)}
                </span>
              </div>
              <div className="rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-green-400 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Total paid out
                </span>
                <span className="text-sm font-bold text-green-400">
                  {formatCurrency(earnedSoFar, stake.currency)}
                </span>
              </div>
            </div>
          )}

          {stake.status === 'CANCELLED' && (
            <div className="space-y-2">
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                This stake was cancelled and is no longer active.
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>Started: {formatDate(start)}</span>
                <span>Was due to end: {formatDate(end)}</span>
              </div>
            </div>
          )}

          {stake.status !== 'ACTIVE' && stake.status !== 'COMPLETED' && stake.status !== 'CANCELLED' && (
            <div className="space-y-2">
              <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm text-yellow-400">
                Your stake is pending activation. Payments will begin once it becomes active.
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>Started: {formatDate(start)}</span>
                <span>Ends: {formatDate(end)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Daily ROI', value: `${stake.dailyRoi}% / day` },
              { label: 'Total ROI', value: `${stake.totalRoi}%` },
              { label: 'Duration', value: `${stake.plan.durationDays} days` },
              { label: 'Currency', value: stake.currency },
              { label: 'Started', value: formatDateTime(stake.startDate) },
              { label: 'End Date', value: formatDateTime(stake.endDate) },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment history */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Payment History</CardTitle>
            {totalPayments > 0 && (
              <span className="text-xs text-muted-foreground">
                {totalPayments} of {stake.plan.durationDays} payment{stake.plan.durationDays !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {stake.payments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No payments yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {stake.payments.map((payment, idx) => (
                <div key={payment.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Day {totalPayments - idx} of {stake.plan.durationDays}
                      <span className="ml-2 font-normal text-green-400">+{formatCurrency(payment.amount, stake.currency)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(payment.date)}
                      <span className="ml-2 text-muted-foreground/60">
                        · Total earned: {formatCurrency(runningTotalsDesc[idx], stake.currency)}
                      </span>
                    </p>
                  </div>
                  <Badge variant="success" className="text-xs">Paid</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
