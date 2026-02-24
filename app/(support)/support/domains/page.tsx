'use client'

import { useState, useEffect, useCallback } from 'react'
import { sanitizeUrl } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Globe, Users, UserPlus, TrendingUp, Wallet, BarChart2,
  Ticket, MessageSquare, Clock, Mail, Image,
} from 'lucide-react'

interface DomainInfo {
  id: string
  domain: string
  name: string | null
  logoUrl: string | null
  supportEmail: string | null
  isActive: boolean
  createdAt: string
}

interface Stats {
  totalUsers: number
  newUsersThisWeek: number
  activeStakes: number
  openTickets: number
  inProgressTickets: number
  unreadChats: number
  totalDeposits: number
  totalWithdrawals: number
  pendingDeposits: number
  pendingWithdrawals: number
}

interface DomainData {
  domain: DomainInfo
  stats: Stats
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${color}`}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SupportDomainsPage() {
  const [data, setData] = useState<DomainData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/support/domains')
      const json = await res.json()
      if (res.ok) setData(json.data)
      else setError(json.error || 'Failed to load domain.')
    } catch {
      setError('Failed to load domain.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <Globe className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">{error || 'No domain data.'}</p>
        </div>
      </div>
    )
  }

  const { domain, stats } = data

  return (
    <div className="space-y-6">
      {/* Domain identity header */}
      <div className="flex items-center gap-4 flex-wrap">
        {domain.logoUrl ? (
          <img
            src={sanitizeUrl(domain.logoUrl)}
            alt="logo"
            className="h-12 w-12 rounded-xl object-cover border border-border flex-shrink-0"
          />
        ) : (
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Globe className="h-6 w-6 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{domain.name || domain.domain}</h1>
            <Badge variant={domain.isActive ? 'success' : 'warning'} className="text-xs">
              {domain.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground font-mono">{domain.domain}</p>
        </div>
      </div>

      {/* Domain details card */}
      <Card>
        <CardHeader><CardTitle className="text-base">Domain Info</CardTitle></CardHeader>
        <CardContent className="divide-y divide-border text-sm">
          {[
            { icon: <Globe    className="h-3.5 w-3.5" />, label: 'Website Name',  value: domain.name         || <em className="text-muted-foreground">Not set</em> },
            { icon: <Globe    className="h-3.5 w-3.5" />, label: 'Domain URL',    value: domain.domain },
            { icon: <Mail     className="h-3.5 w-3.5" />, label: 'Support Email', value: domain.supportEmail || <em className="text-muted-foreground">Not set</em> },
            { icon: <Image    className="h-3.5 w-3.5" />, label: 'Logo',
              value: domain.logoUrl
                ? <img src={sanitizeUrl(domain.logoUrl)} alt="logo" className="h-8 w-8 rounded object-cover border border-border inline-block" />
                : <em className="text-muted-foreground">Not set</em> },
            { icon: <Clock    className="h-3.5 w-3.5" />, label: 'Added',         value: new Date(domain.createdAt).toLocaleDateString() },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center justify-between py-2.5 gap-4">
              <span className="text-muted-foreground flex items-center gap-1.5 flex-shrink-0">{icon}{label}</span>
              <span className="text-right">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Domain Statistics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            icon={<Users className="h-5 w-5 text-blue-500" />}
            label="Total Users"
            value={stats.totalUsers.toLocaleString()}
            sub={stats.newUsersThisWeek > 0 ? `+${stats.newUsersThisWeek} this week` : undefined}
            color="bg-blue-500/10"
          />
          <StatCard
            icon={<BarChart2 className="h-5 w-5 text-purple-500" />}
            label="Active Stakes"
            value={stats.activeStakes.toLocaleString()}
            color="bg-purple-500/10"
          />
          <StatCard
            icon={<Ticket className="h-5 w-5 text-orange-500" />}
            label="Open Tickets"
            value={stats.openTickets.toLocaleString()}
            sub={stats.inProgressTickets > 0 ? `${stats.inProgressTickets} in-progress` : undefined}
            color="bg-orange-500/10"
          />
          <StatCard
            icon={<MessageSquare className="h-5 w-5 text-pink-500" />}
            label="Unread Chats"
            value={stats.unreadChats.toLocaleString()}
            color="bg-pink-500/10"
          />
          <StatCard
            icon={<UserPlus className="h-5 w-5 text-teal-500" />}
            label="New This Week"
            value={stats.newUsersThisWeek.toLocaleString()}
            color="bg-teal-500/10"
          />
        </div>
      </div>

      {/* Financial stats */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Financial Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Confirmed Deposits</p>
                <p className="text-2xl font-bold">
                  ${stats.totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {stats.pendingDeposits > 0 && (
                  <p className="text-xs text-warning">{stats.pendingDeposits} pending</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-lg flex-shrink-0">
                <Wallet className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed Withdrawals</p>
                <p className="text-2xl font-bold">
                  ${stats.totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {stats.pendingWithdrawals > 0 && (
                  <p className="text-xs text-warning">{stats.pendingWithdrawals} pending</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
