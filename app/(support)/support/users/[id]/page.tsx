'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Globe, Shield, TrendingUp, Wallet, Ticket, MessageSquare } from 'lucide-react'
import Link from 'next/link'

// ---- Types ----------------------------------------------------------------
interface Domain { id: string; domain: string; name: string | null }

interface UserDetail {
  id: string
  email: string
  username: string | null
  firstName: string | null
  lastName: string | null
  role: string
  isActive: boolean
  bannedAt: string | null
  bannedReason: string | null
  balance: number
  twoFaEnabled: boolean
  pinEnabled: boolean
  referralCode: string
  lastLoginAt: string | null
  lastLoginIp: string | null
  createdAt: string
  domain: Domain | null
  _count: { stakes: number; deposits: number; withdrawals: number }
  stakes: Stake[]
  deposits: Deposit[]
  withdrawals: Withdrawal[]
  tickets: TicketItem[]
}

interface Stake {
  id: string; amount: number; currency: string; status: string
  dailyRoi: number; totalRoi: number; totalEarned: number; expectedReturn: number
  startDate: string; endDate: string; createdAt: string
  plan: { name: string }
}

interface Deposit {
  id: string; amount: number; amountUsd: number | null; status: string
  txHash: string | null; createdAt: string; confirmedAt: string | null
  currency: { symbol: string; name: string }
}

interface Withdrawal {
  id: string; amount: number; netAmount: number; fee: number
  status: string; walletAddress: string; txHash: string | null
  createdAt: string; reviewedAt: string | null
  currency: { symbol: string; name: string }
}

interface TicketItem {
  id: string; subject: string; category: string; status: string; createdAt: string
}

// ---- Helpers ---------------------------------------------------------------
function userName(u: UserDetail) {
  const full = [u.firstName, u.lastName].filter(Boolean).join(' ')
  return full || u.username || u.email
}

function statusBadge(u: UserDetail) {
  if (u.bannedAt) return <Badge variant="destructive" className="text-xs">Banned</Badge>
  if (u.isActive) return <Badge variant="success"     className="text-xs">Active</Badge>
  return                  <Badge variant="warning"    className="text-xs">Inactive</Badge>
}

const ticketVariant: Record<string, 'warning' | 'default' | 'success'> = {
  OPEN: 'warning', IN_PROGRESS: 'default', CLOSED: 'success', RESOLVED: 'success',
}

const depositVariant: Record<string, 'warning' | 'success' | 'destructive' | 'secondary'> = {
  PENDING: 'warning', CONFIRMED: 'success', REJECTED: 'destructive', CANCELLED: 'secondary',
}

const withdrawalVariant: Record<string, 'warning' | 'success' | 'destructive' | 'secondary'> = {
  PENDING: 'warning', COMPLETED: 'success', REJECTED: 'destructive', CANCELLED: 'secondary',
}

// ---- Component -------------------------------------------------------------
export default function SupportUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/support/users/${id}`)
      const json = await res.json()
      if (res.ok) setUser(json.data)
      else setError(json.error || 'Failed to load user.')
    } catch {
      setError('Failed to load user.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Loading…</div>
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Link href="/support/users" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </Link>
        <p className="text-destructive">{error || 'User not found.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/support/users" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </Link>

      {/* Profile header */}
      <div className="flex items-start gap-4 flex-wrap">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
          {(user.firstName?.[0] || user.email[0]).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{userName(user)}</h1>
            {statusBadge(user)}
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {user.domain && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Globe className="h-3 w-3" /> {user.domain.name || user.domain.domain}
            </p>
          )}
        </div>
        {/* Read-only balance display */}
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className="text-2xl font-bold">${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Stakes',      value: user._count.stakes,      icon: <TrendingUp className="h-4 w-4 text-green-500" /> },
          { label: 'Deposits',    value: user._count.deposits,    icon: <Wallet className="h-4 w-4 text-blue-500" /> },
          { label: 'Withdrawals', value: user._count.withdrawals, icon: <Wallet className="h-4 w-4 text-orange-500" /> },
        ].map(({ label, value, icon }) => (
          <Card key={label}>
            <CardContent className="p-3 flex items-center gap-2">
              {icon}
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="stakes">Stakes ({user._count.stakes})</TabsTrigger>
          <TabsTrigger value="deposits">Deposits ({user._count.deposits})</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals ({user._count.withdrawals})</TabsTrigger>
          <TabsTrigger value="tickets">Tickets ({user.tickets.length})</TabsTrigger>
        </TabsList>

        {/* ── Profile ── */}
        <TabsContent value="profile" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Account Info</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  { label: 'Email',       value: user.email },
                  { label: 'Username',    value: user.username || '—' },
                  { label: 'Referral Code', value: user.referralCode || '—' },
                  { label: 'Joined',      value: new Date(user.createdAt).toLocaleString() },
                  { label: 'Last Login',  value: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—' },
                  { label: 'Last IP',     value: user.lastLoginIp || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-right break-all">{value}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {statusBadge(user)}
                </div>
                {user.bannedReason && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Ban Reason</span>
                    <span className="text-right text-destructive">{user.bannedReason}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Security</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  { label: '2FA Enabled',  value: user.twoFaEnabled  ? 'Yes' : 'No' },
                  { label: 'PIN Enabled',  value: user.pinEnabled    ? 'Yes' : 'No' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> {label}</span>
                    <Badge variant={value === 'Yes' ? 'success' : 'secondary'} className="text-xs">{value}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Stakes ── */}
        <TabsContent value="stakes" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-4 py-2 font-medium">Plan</th>
                    <th className="text-left px-4 py-2 font-medium">Amount</th>
                    <th className="text-left px-4 py-2 font-medium">Earned</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="text-left px-4 py-2 font-medium">Start</th>
                    <th className="text-left px-4 py-2 font-medium">End</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {user.stakes.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No stakes.</td></tr>
                  )}
                  {user.stakes.map((s) => (
                    <tr key={s.id} className="hover:bg-secondary/20">
                      <td className="px-4 py-2">{s.plan.name}</td>
                      <td className="px-4 py-2 font-mono">${s.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2 font-mono text-green-500">${s.totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2"><Badge variant={s.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-xs">{s.status}</Badge></td>
                      <td className="px-4 py-2 text-muted-foreground">{new Date(s.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-muted-foreground">{new Date(s.endDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Deposits ── */}
        <TabsContent value="deposits" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-4 py-2 font-medium">Amount</th>
                    <th className="text-left px-4 py-2 font-medium">Currency</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="text-left px-4 py-2 font-medium">Date</th>
                    <th className="text-left px-4 py-2 font-medium">Tx Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {user.deposits.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No deposits.</td></tr>
                  )}
                  {user.deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-secondary/20">
                      <td className="px-4 py-2 font-mono">{d.amount} {d.currency.symbol}{d.amountUsd ? ` (~$${d.amountUsd.toFixed(2)})` : ''}</td>
                      <td className="px-4 py-2">{d.currency.name}</td>
                      <td className="px-4 py-2"><Badge variant={depositVariant[d.status] ?? 'secondary'} className="text-xs">{d.status}</Badge></td>
                      <td className="px-4 py-2 text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-muted-foreground text-xs font-mono truncate max-w-[120px]">{d.txHash || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Withdrawals ── */}
        <TabsContent value="withdrawals" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-4 py-2 font-medium">Amount</th>
                    <th className="text-left px-4 py-2 font-medium">Currency</th>
                    <th className="text-left px-4 py-2 font-medium">Net</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="text-left px-4 py-2 font-medium">Wallet</th>
                    <th className="text-left px-4 py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {user.withdrawals.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No withdrawals.</td></tr>
                  )}
                  {user.withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-secondary/20">
                      <td className="px-4 py-2 font-mono">{w.amount} {w.currency.symbol}</td>
                      <td className="px-4 py-2">{w.currency.name}</td>
                      <td className="px-4 py-2 font-mono text-muted-foreground">{w.netAmount} <span className="text-xs">(-{w.fee} fee)</span></td>
                      <td className="px-4 py-2"><Badge variant={withdrawalVariant[w.status] ?? 'secondary'} className="text-xs">{w.status}</Badge></td>
                      <td className="px-4 py-2 text-muted-foreground text-xs font-mono truncate max-w-[120px]">{w.walletAddress}</td>
                      <td className="px-4 py-2 text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tickets ── */}
        <TabsContent value="tickets" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-4 py-2 font-medium">Subject</th>
                    <th className="text-left px-4 py-2 font-medium">Category</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="text-left px-4 py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {user.tickets.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No tickets.</td></tr>
                  )}
                  {user.tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-secondary/20">
                      <td className="px-4 py-2 max-w-[200px] truncate">{t.subject}</td>
                      <td className="px-4 py-2 text-muted-foreground">{t.category}</td>
                      <td className="px-4 py-2"><Badge variant={ticketVariant[t.status] ?? 'secondary'} className="text-xs">{t.status}</Badge></td>
                      <td className="px-4 py-2 text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User: {user.firstName} {user.lastName}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{user.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Username</span><span>{user.username}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{user.telegramChatId || '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={user.bannedAt ? 'destructive' : user.isActive ? 'success' : 'warning'} className="text-xs">{user.bannedAt ? 'Banned' : user.isActive ? 'Active' : 'Inactive'}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><span>{new Date(user.createdAt).toLocaleDateString()}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Support Tickets</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground"><th className="text-left px-4 py-2 font-medium">Subject</th><th className="text-left px-4 py-2 font-medium">Status</th><th className="text-left px-4 py-2 font-medium">Date</th></tr></thead>
            <tbody className="divide-y divide-border">
              {user.tickets.map((t) => (
                <tr key={t.id}><td className="px-4 py-2">{t.subject}</td><td className="px-4 py-2"><Badge variant={t.status === 'OPEN' ? 'warning' : 'secondary'} className="text-xs">{t.status}</Badge></td><td className="px-4 py-2 text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</td></tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
