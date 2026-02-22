import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-helpers'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AdminUserActions from './AdminUserActions'

export const dynamic = 'force-dynamic'

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      stakes: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      deposits: { include: { currency: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      withdrawals: { include: { currency: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
      loginHistory: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })

  if (!user) notFound()

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">User: {user.username || user.email}</h1>
      </div>

      {/* Profile + Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="p-5 grid grid-cols-2 gap-3 text-sm">
            {[
              { l: 'Email', v: user.email },
              { l: 'Username', v: user.username || '—' },
              { l: 'Full Name', v: [user.firstName, user.lastName].filter(Boolean).join(' ') || '—' },
              { l: 'Role', v: user.role },
              { l: 'Balance', v: formatCurrency(user.balance) },
              { l: 'Status', v: user.bannedAt ? 'Banned' : user.isActive ? 'Active' : 'Inactive' },
              { l: 'Joined', v: formatDateTime(user.createdAt) },
              { l: 'Last Login', v: user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—' },
              { l: 'Last IP', v: user.lastLoginIp || '—' },
              { l: '2FA', v: user.twoFaEnabled ? 'Enabled' : 'Disabled' },
              { l: 'Referral Code', v: user.referralCode || '—' },
            ].map((row) => (
              <div key={row.l}>
                <p className="text-muted-foreground text-xs">{row.l}</p>
                <p className="font-medium">{row.v}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <AdminUserActions user={{ id: user.id, isActive: user.isActive, bannedAt: user.bannedAt?.toISOString() || null, balance: user.balance, role: user.role }} />
      </div>

      {/* Stakes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Stakes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left pb-2 font-medium">Plan</th>
                  <th className="text-left pb-2 font-medium">Amount</th>
                  <th className="text-left pb-2 font-medium">Return</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                  <th className="text-left pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {user.stakes.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2">{s.plan.name}</td>
                    <td className="py-2">{formatCurrency(s.amount)}</td>
                    <td className="py-2 text-primary">{formatCurrency(s.expectedReturn)}</td>
                    <td className="py-2">
                      <Badge variant={s.status === 'ACTIVE' ? 'success' : 'info'} className="text-xs">{s.status}</Badge>
                    </td>
                    <td className="py-2 text-muted-foreground text-xs">{formatDateTime(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Deposits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Deposits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left pb-2 font-medium">Amount</th>
                  <th className="text-left pb-2 font-medium">Currency</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                  <th className="text-left pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {user.deposits.map((d) => (
                  <tr key={d.id}>
                    <td className="py-2">{formatCurrency(d.amount)}</td>
                    <td className="py-2">{d.currency.symbol}</td>
                    <td className="py-2">
                      <Badge variant={d.status === 'CONFIRMED' ? 'success' : d.status === 'FAILED' ? 'error' : 'warning'} className="text-xs">{d.status}</Badge>
                    </td>
                    <td className="py-2 text-muted-foreground text-xs">{formatDateTime(d.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left pb-2 font-medium">Amount</th>
                  <th className="text-left pb-2 font-medium">Currency</th>
                  <th className="text-left pb-2 font-medium">Wallet</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                  <th className="text-left pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {user.withdrawals.length === 0 ? (
                  <tr><td colSpan={5} className="py-4 text-center text-muted-foreground text-xs">No withdrawals</td></tr>
                ) : user.withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td className="py-2">{formatCurrency(w.amount)}</td>
                    <td className="py-2">{w.currency.symbol}</td>
                    <td className="py-2 font-mono text-xs max-w-[140px] truncate">{w.walletAddress}</td>
                    <td className="py-2">
                      <Badge variant={w.status === 'COMPLETED' ? 'success' : w.status === 'REJECTED' || w.status === 'FAILED' ? 'error' : 'warning'} className="text-xs">{w.status}</Badge>
                    </td>
                    <td className="py-2 text-muted-foreground text-xs">{formatDateTime(w.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left pb-2 font-medium">Type</th>
                  <th className="text-left pb-2 font-medium">Amount</th>
                  <th className="text-left pb-2 font-medium">Description</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                  <th className="text-left pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {user.transactions.length === 0 ? (
                  <tr><td colSpan={5} className="py-4 text-center text-muted-foreground text-xs">No transactions</td></tr>
                ) : user.transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2">
                      <Badge variant="info" className="text-xs">{t.type}</Badge>
                    </td>
                    <td className="py-2 font-medium">{formatCurrency(t.amount)}</td>
                    <td className="py-2 text-muted-foreground text-xs max-w-[160px] truncate">{t.description || '—'}</td>
                    <td className="py-2">
                      <Badge variant={t.status === 'COMPLETED' ? 'success' : 'warning'} className="text-xs">{t.status}</Badge>
                    </td>
                    <td className="py-2 text-muted-foreground text-xs">{formatDateTime(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Login History */}
      {user.loginHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Login History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left pb-2 font-medium">IP Address</th>
                    <th className="text-left pb-2 font-medium">User Agent</th>
                    <th className="text-left pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {user.loginHistory.map((l) => (
                    <tr key={l.id}>
                      <td className="py-2 font-mono text-xs">{l.ipAddress || '—'}</td>
                      <td className="py-2 text-muted-foreground text-xs max-w-[200px] truncate">{l.userAgent || '—'}</td>
                      <td className="py-2 text-muted-foreground text-xs">{formatDateTime(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
