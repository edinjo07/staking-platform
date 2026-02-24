'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users, MessageSquare, Ticket, TrendingUp, Wallet, BarChart2,
  Globe, UserPlus, Clock, Activity,
} from 'lucide-react'
import Link from 'next/link'
import { SafeImg } from '@/components/shared/SafeImg'

interface DomainInfo {
  id: string
  domain: string
  name: string | null
  logoUrl: string | null
  supportEmail: string | null
  isActive: boolean
}

interface Stats {
  totalUsers: number
  newUsersThisWeek: number
  openTickets: number
  inProgressTickets: number
  unreadChats: number
  totalDeposits: number
  totalWithdrawals: number
  activeStakes: number
}

interface RecentTicket {
  id: string
  subject: string
  category: string
  status: string
  createdAt: string
  user: { firstName: string | null; lastName: string | null; email: string }
}

interface RecentUser {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  createdAt: string
  balance: number
}

interface RecentChat {
  id: string
  content: string
  createdAt: string
  user: { id: string; firstName: string | null; lastName: string | null; email: string }
}

interface DashboardData {
  domain: DomainInfo
  stats: Stats
  recentTickets: RecentTicket[]
  recentUsers: RecentUser[]
  recentChats: RecentChat[]
}

const statusVariant: Record<string, 'warning' | 'default' | 'success'> = {
  OPEN: 'warning',
  IN_PROGRESS: 'default',
  CLOSED: 'success',
  RESOLVED: 'success',
}

function userName(u: { firstName: string | null; lastName: string | null; email: string }) {
  return u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.email
}

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function SupportDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/support/stats')
      const json = await res.json()
      if (res.ok) setData(json.data)
      else setError(json.error || 'Failed to load stats.')
    } catch {
      setError('Failed to load stats.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm">Loading dashboard...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <Globe className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">{error || 'No data available.'}</p>
        </div>
      </div>
    )
  }

  const { domain, stats, recentTickets, recentUsers, recentChats } = data

  return (
    <div className="space-y-6">
      {/* Header with domain identity */}
      <div className="flex items-center gap-3">
        {domain.logoUrl ? (
          <SafeImg src={domain.logoUrl} alt="logo" className="h-10 w-10 rounded-lg object-cover border border-border" />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{domain.name || domain.domain}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            {domain.domain}
            <Badge variant={domain.isActive ? 'success' : 'warning'} className="text-xs">{domain.isActive ? 'Active' : 'Inactive'}</Badge>
          </p>
        </div>
        {domain.supportEmail && /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(domain.supportEmail) && (
          <a href={`mailto:${encodeURIComponent(domain.supportEmail)}`} className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors">
            {domain.supportEmail}
          </a>
        )}
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Users</p>
              <p className="text-xl font-bold">{stats.totalUsers.toLocaleString()}</p>
              {stats.newUsersThisWeek > 0 && (
                <p className="text-xs text-green-500">+{stats.newUsersThisWeek} this week</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg flex-shrink-0">
              <Ticket className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Open Tickets</p>
              <p className="text-xl font-bold">{stats.openTickets.toLocaleString()}</p>
              {stats.inProgressTickets > 0 && (
                <p className="text-xs text-muted-foreground">{stats.inProgressTickets} in-progress</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
              <MessageSquare className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unread Chats</p>
              <p className="text-xl font-bold">{stats.unreadChats.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg flex-shrink-0">
              <BarChart2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Stakes</p>
              <p className="text-xl font-bold">{stats.activeStakes.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Confirmed Deposits</p>
              <p className="text-2xl font-bold">
                ${stats.totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-lg flex-shrink-0">
              <Wallet className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Completed Withdrawals</p>
              <p className="text-2xl font-bold">
                ${stats.totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Ticket className="h-4 w-4" /> Recent Tickets
              </CardTitle>
              <Link href="/support/tickets" className="text-xs text-primary hover:underline">View all</Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentTickets.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">No tickets yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left px-4 py-2 font-medium">User</th>
                      <th className="text-left px-4 py-2 font-medium">Subject</th>
                      <th className="text-left px-4 py-2 font-medium">Status</th>
                      <th className="text-left px-4 py-2 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-secondary/20">
                        <td className="px-4 py-2.5 text-sm">{userName(t.user)}</td>
                        <td className="px-4 py-2.5 max-w-[180px] truncate text-muted-foreground">{t.subject}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant={statusVariant[t.status] ?? 'secondary'} className="text-xs">{t.status}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          <Clock className="h-3 w-3 inline mr-1" />{timeAgo(t.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: recent users + recent chats */}
        <div className="space-y-4">
          {/* Recent registrations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> New Users
              </CardTitle>
              <Link href="/support/users" className="text-xs text-primary hover:underline">View all</Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentUsers.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">No users yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {recentUsers.map((u) => (
                    <div key={u.id} className="px-4 py-2.5 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{userName(u)}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">{timeAgo(u.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent unread chats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" /> Pending Chats
                {stats.unreadChats > 0 && (
                  <Badge variant="destructive" className="text-xs ml-1 h-4 px-1.5">{stats.unreadChats}</Badge>
                )}
              </CardTitle>
              <Link href="/support/chat" className="text-xs text-primary hover:underline">Open chat</Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentChats.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">No pending messages.</p>
              ) : (
                <div className="divide-y divide-border">
                  {recentChats.map((c) => (
                    <div key={c.id} className="px-4 py-2.5">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-medium truncate">{userName(c.user)}</p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">{timeAgo(c.createdAt)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
