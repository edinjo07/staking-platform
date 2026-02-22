'use client'

import { useState, useEffect, useCallback } from 'react'
import { StatsCard } from '@/components/shared/StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, TrendingUp, ArrowDownLeft, ArrowUpRight, DollarSign, Globe } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Domain { id: string; domain: string; name: string | null; isActive: boolean }

interface DomainRow {
  id: string; domain: string; name: string | null; isActive: boolean
  users: number; activeStakes: number; pendingDeposits: number; pendingWithdrawals: number
}

interface TxUser { firstName: string | null; lastName: string | null; email: string }
interface RecentDeposit   { id: string; amount: number; status: string; createdAt: string; user: TxUser; currency: { symbol: string } }
interface RecentWithdrawal { id: string; amount: number; status: string; createdAt: string; user: TxUser; currency: { symbol: string } }

interface Stats {
  totalUsers: number; activeStakes: number; pendingDeposits: number; pendingWithdrawals: number
  totalDeposited: number; totalWithdrawn: number
  recentDeposits: RecentDeposit[]; recentWithdrawals: RecentWithdrawal[]
  domainBreakdown: DomainRow[]
}

function txUserName(u: TxUser) {
  const full = [u.firstName, u.lastName].filter(Boolean).join(' ')
  return full || u.email
}

export default function WorkerDashboardPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL')
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/worker/domains')
      .then((r) => r.json())
      .then((d) => setDomains(d.domains ?? []))
  }, [])

  const loadStats = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedDomain !== 'ALL') params.set('domainId', selectedDomain)
    fetch(`/api/worker/stats?${params}`)
      .then((r) => r.json())
      .then((d) => setStats(d.data ?? null))
      .finally(() => setLoading(false))
  }, [selectedDomain])

  useEffect(() => { loadStats() }, [loadStats])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Worker Dashboard</h1>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All Domains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Domains</SelectItem>
              {domains.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name || d.domain}{!d.isActive ? ' (inactive)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Domain Users"        value={loading ? '…' : `${stats?.totalUsers ?? 0}`}         icon={<Users         className="h-4 w-4" />} />
        <StatsCard title="Active Stakes"       value={loading ? '…' : `${stats?.activeStakes ?? 0}`}       icon={<TrendingUp    className="h-4 w-4" />} />
        <StatsCard title="Pending Deposits"    value={loading ? '…' : `${stats?.pendingDeposits ?? 0}`}    icon={<ArrowDownLeft className="h-4 w-4" />} />
        <StatsCard title="Pending Withdrawals" value={loading ? '…' : `${stats?.pendingWithdrawals ?? 0}`} icon={<ArrowUpRight  className="h-4 w-4" />} />
      </div>

      {/* Financial totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Deposited</p>
              <p className="text-xl font-bold font-mono">
                ${(stats?.totalDeposited ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Withdrawn</p>
              <p className="text-xl font-bold font-mono">
                ${(stats?.totalWithdrawn ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domain breakdown table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Domain Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Domain</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Users</th>
                  <th className="text-left px-4 py-3 font-medium">Active Stakes</th>
                  <th className="text-left px-4 py-3 font-medium">Pending Deposits</th>
                  <th className="text-left px-4 py-3 font-medium">Pending Withdrawals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">Loading…</td></tr>
                ) : (stats?.domainBreakdown ?? []).length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">No domains configured.</td></tr>
                ) : (stats?.domainBreakdown ?? []).map((d) => (
                  <tr
                    key={d.id}
                    className={`hover:bg-secondary/20 transition-colors cursor-pointer ${selectedDomain === d.id ? 'bg-primary/5' : ''}`}
                    onClick={() => setSelectedDomain(selectedDomain === d.id ? 'ALL' : d.id)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{d.domain}</p>
                      {d.name && <p className="text-xs text-muted-foreground">{d.name}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={d.isActive ? 'success' : 'warning'} className="text-xs">
                        {d.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono">{d.users}</td>
                    <td className="px-4 py-3 font-mono">{d.activeStakes}</td>
                    <td className="px-4 py-3">
                      <span className={d.pendingDeposits > 0 ? 'text-yellow-500 font-mono' : 'font-mono'}>{d.pendingDeposits}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={d.pendingWithdrawals > 0 ? 'text-orange-500 font-mono' : 'font-mono'}>{d.pendingWithdrawals}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedDomain === 'ALL' && (
            <p className="text-xs text-muted-foreground px-4 py-2 border-t border-border">
              Click a row to scope the dashboard to that domain.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Deposits */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Deposits</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-4 py-2 font-medium">User</th>
                  <th className="text-left px-4 py-2 font-medium">Amount</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground text-xs">Loading…</td></tr>
                ) : (stats?.recentDeposits ?? []).length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground text-xs">No deposits.</td></tr>
                ) : (stats?.recentDeposits ?? []).map((d) => (
                  <tr key={d.id} className="hover:bg-secondary/20">
                    <td className="px-4 py-2 max-w-[110px] truncate">{txUserName(d.user)}</td>
                    <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">{d.currency.symbol} {Number(d.amount).toFixed(4)}</td>
                    <td className="px-4 py-2">
                      <Badge variant={d.status === 'CONFIRMED' ? 'success' : d.status === 'PENDING' ? 'warning' : 'destructive'} className="text-xs">{d.status}</Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Recent Withdrawals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Withdrawals</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-4 py-2 font-medium">User</th>
                  <th className="text-left px-4 py-2 font-medium">Amount</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground text-xs">Loading…</td></tr>
                ) : (stats?.recentWithdrawals ?? []).length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground text-xs">No withdrawals.</td></tr>
                ) : (stats?.recentWithdrawals ?? []).map((w) => (
                  <tr key={w.id} className="hover:bg-secondary/20">
                    <td className="px-4 py-2 max-w-[110px] truncate">{txUserName(w.user)}</td>
                    <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">{w.currency.symbol} {Number(w.amount).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <Badge variant={w.status === 'COMPLETED' ? 'success' : w.status === 'PENDING' ? 'warning' : 'destructive'} className="text-xs">{w.status}</Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(w.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
