'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import Link from 'next/link'

interface Stake {
  id: string
  amount: number
  totalEarned: number
  expectedReturn: number
  dailyRoi: number
  status: string
  startDate: string
  endDate: string
  createdAt: string
  user: { id: string; email: string; username: string | null }
  plan: { name: string }
}

export default function AdminHistoryStakingPage() {
  const [stakes, setStakes] = useState<Stake[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    fetch('/api/admin/staking/history')
      .then((r) => r.json())
      .then((d) => setStakes(d.data || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = stakes.filter((s) => {
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter
    const q = search.toLowerCase()
    const matchesSearch = !q || s.user.email.toLowerCase().includes(q) || (s.user.username || '').toLowerCase().includes(q) || s.plan.name.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Staking History ({filtered.length})</h1>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Search user or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-52"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">User</th>
                    <th className="text-left px-4 py-3 font-medium">Plan</th>
                    <th className="text-left px-4 py-3 font-medium">Amount</th>
                    <th className="text-left px-4 py-3 font-medium">Earned</th>
                    <th className="text-left px-4 py-3 font-medium">Expected</th>
                    <th className="text-left px-4 py-3 font-medium">Daily ROI</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Start</th>
                    <th className="text-left px-4 py-3 font-medium">End</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">No stakes found.</td>
                    </tr>
                  ) : filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/users/${s.user.id}`} className="text-primary text-xs hover:underline">
                          {s.user.username || s.user.email}
                        </Link>
                        <p className="text-xs text-muted-foreground">{s.user.email}</p>
                      </td>
                      <td className="px-4 py-3 font-medium">{s.plan.name}</td>
                      <td className="px-4 py-3">{formatCurrency(s.amount)}</td>
                      <td className="px-4 py-3 text-emerald-500">{formatCurrency(s.totalEarned)}</td>
                      <td className="px-4 py-3">{formatCurrency(s.expectedReturn)}</td>
                      <td className="px-4 py-3">{s.dailyRoi}%</td>
                      <td className="px-4 py-3">
                        <Badge variant={s.status === 'ACTIVE' ? 'success' : 'info'} className="text-xs">{s.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(s.startDate)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(s.endDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
