import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { Users, DollarSign, TrendingUp, Link as LinkIcon, Percent, ExternalLink } from 'lucide-react'
import CopyButton from './CopyButton'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ReferralsPage() {
  const session = await requireAuth()

  const [user, referrals, earnings, commissionSetting] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referralCode: true },
    }),
    prisma.user.findMany({
      where: { referredById: session.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        isActive: true,
        _count: {
          select: {
            stakes: true,
            // count only currently active stakes for the badge
          },
        },
        stakes: {
          where: { status: 'ACTIVE' },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.referralEarning.findMany({
      where: { userId: session.user.id },
      include: { fromUser: { select: { username: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.siteSetting.findUnique({ where: { key: 'referral_bonus_percent' } }),
  ])

  const totalEarnings = earnings.reduce((s, e) => s + e.amount, 0)
  const commissionRate = commissionSetting ? parseFloat(commissionSetting.value) : null

  // Derive per-referred-user total earnings
  const earningsByUser = earnings.reduce<Record<string, number>>((acc, e) => {
    acc[e.fromUserId] = (acc[e.fromUserId] ?? 0) + e.amount
    return acc
  }, {})

  // "Investing" = referred user currently has at least one ACTIVE stake
  const investingReferrals = referrals.filter((r) => r.stakes.length > 0).length

  // Running totals for fee history (entries are desc, accumulate from last → first)
  const earningsAsc = [...earnings].reverse()
  const runningTotals = earningsAsc.reduce<number[]>((acc, e) => {
    acc.push((acc[acc.length - 1] ?? 0) + e.amount)
    return acc
  }, [])
  const runningTotalsDesc = [...runningTotals].reverse()

  // Build base URL — consistent with the rest of the codebase
  const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
  const referralLink = user?.referralCode
    ? `${baseUrl}/signup?ref=${user.referralCode}`
    : ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Referrals</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Invite friends and earn commissions on their staking activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Referrals</p>
              <p className="text-xl font-bold">{referrals.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5"><DollarSign className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Earned</p>
              <p className="text-xl font-bold">{formatCurrency(totalEarnings)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5"><TrendingUp className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Investing</p>
              <p className="text-xl font-bold">{investingReferrals}</p>
              <p className="text-xs text-muted-foreground">of {referrals.length} referred</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5"><Percent className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Commission Rate</p>
              <p className="text-xl font-bold">
                {commissionRate !== null ? `${commissionRate}%` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">per stake payout</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link to earn {commissionRate !== null ? `${commissionRate}% ` : ''}commissions when friends sign up and invest.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1 rounded-lg bg-secondary/40 border border-border px-4 py-3 font-mono text-sm break-all select-all">
              {referralLink || <span className="text-muted-foreground italic">Link unavailable — set NEXTAUTH_URL</span>}
            </div>
            {referralLink && <CopyButton text={referralLink} />}
          </div>
          {user?.referralCode && (
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">
                Referral code:{' '}
                <span className="font-mono font-medium text-primary">{user.referralCode}</span>
              </p>
              <CopyButton text={user.referralCode} label="Copy Code" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referred users */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Referred Users</CardTitle>
            <span className="text-xs text-muted-foreground">{referrals.length} total · {investingReferrals} investing</span>
          </div>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No referrals yet. Share your link to start earning!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left pb-3 font-medium">User</th>
                    <th className="text-left pb-3 font-medium">Joined</th>
                    <th className="text-left pb-3 font-medium">Stakes</th>
                    <th className="text-left pb-3 font-medium">Earned from</th>
                    <th className="text-left pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{ref.username || 'Anonymous'}</p>
                          <p className="text-xs text-muted-foreground">{ref.email}</p>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">{formatDate(ref.createdAt)}</td>
                      <td className="py-3">
                        <span className={ref._count.stakes > 0 ? 'font-medium text-primary' : 'text-muted-foreground'}>
                          {ref._count.stakes}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-green-400">
                        {earningsByUser[ref.id] ? `+${formatCurrency(earningsByUser[ref.id])}` : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-3">
                        <Badge variant={ref.stakes.length > 0 ? 'success' : ref._count.stakes > 0 ? 'info' : ref.isActive ? 'warning' : 'secondary'}>
                          {ref.stakes.length > 0 ? 'Investing' : ref._count.stakes > 0 ? 'Past investor' : ref.isActive ? 'Registered' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Earnings history */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Referral Fee History</CardTitle>
            {earnings.length > 0 && (
              <span className="text-xs text-muted-foreground">{earnings.length} payout{earnings.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No referral fees earned yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left pb-3 font-medium">Date</th>
                    <th className="text-left pb-3 font-medium">From</th>
                    <th className="text-left pb-3 font-medium">Amount</th>
                    <th className="text-left pb-3 font-medium">Rate</th>
                    <th className="text-left pb-3 font-medium">Type</th>
                    <th className="text-left pb-3 font-medium">Order</th>
                    <th className="text-left pb-3 font-medium">Cumulative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {earnings.map((e, idx) => (
                    <tr key={e.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3 text-muted-foreground whitespace-nowrap">{formatDateTime(e.createdAt)}</td>
                      <td className="py-3">{e.fromUser.username || e.fromUser.email}</td>
                      <td className="py-3 font-medium text-green-400">+{formatCurrency(e.amount)}</td>
                      <td className="py-3 text-muted-foreground">{e.percentage}%</td>
                      <td className="py-3">
                        <Badge variant="info" className="text-xs capitalize">{e.type.toLowerCase()}</Badge>
                      </td>
                      <td className="py-3">
                        {e.stakeId ? (
                          <Link
                            href={`/orders/${e.stakeId}`}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground/70 whitespace-nowrap">
                        {formatCurrency(runningTotalsDesc[idx])}
                      </td>
                    </tr>
                  ))}
                  {/* Grand total row */}
                  <tr className="border-t-2 border-border bg-secondary/20">
                    <td colSpan={2} className="py-3 text-sm font-semibold">Total</td>
                    <td className="py-3 text-sm font-bold text-green-400">+{formatCurrency(totalEarnings)}</td>
                    <td colSpan={4} />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
