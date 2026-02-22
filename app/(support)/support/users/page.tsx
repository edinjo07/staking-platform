'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { Search, Eye } from 'lucide-react'

interface User {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  username: string | null
  balance: number
  isActive: boolean
  bannedAt: string | null
  createdAt: string
  _count: { stakes: number; deposits: number }
}

function userName(u: User) {
  const full = [u.firstName, u.lastName].filter(Boolean).join(' ')
  return full || u.username || u.email
}

export default function SupportUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState('ALL')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350)
    return () => clearTimeout(t)
  }, [q])

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (debouncedQ)       params.set('q', debouncedQ)
    if (status !== 'ALL') params.set('status', status)
    fetch(`/api/support/users?${params}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.data ?? []))
      .finally(() => setLoading(false))
  }, [debouncedQ, status])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Users</h1>
        <span className="text-sm text-muted-foreground">{loading ? 'Loading...' : `${users.length} result${users.length !== 1 ? 's' : ''}`}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name / email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="BANNED">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Balance</th>
                <th className="text-left px-4 py-3 font-medium">Stakes</th>
                <th className="text-left px-4 py-3 font-medium">Deposits</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Joined</th>
                <th className="text-left px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!loading && users.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No users found.</td></tr>
              )}
              {!loading && users.map((u) => (
                <tr key={u.id} className="hover:bg-secondary/20">
                  <td className="px-4 py-3 font-medium">{userName(u)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                  <td className="px-4 py-3 font-mono text-sm">${u.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">{u._count.stakes}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">{u._count.deposits}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {u.bannedAt
                      ? <Badge variant="destructive" className="text-xs">Banned</Badge>
                      : u.isActive
                        ? <Badge variant="success" className="text-xs">Active</Badge>
                        : <Badge variant="warning" className="text-xs">Inactive</Badge>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Link href={`/support/users/${u.id}`} className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                      <Eye className="h-3 w-3" /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
