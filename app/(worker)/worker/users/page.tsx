'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { Search, Globe } from 'lucide-react'

interface Domain { id: string; domain: string; name: string | null; isActive: boolean }

interface User {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  username: string | null
  role: string
  balance: number
  isActive: boolean
  bannedAt: string | null
  createdAt: string
  domain: Domain | null
  _count: { stakes: number; deposits: number }
}

export default function WorkerUsersPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ q: '', domainId: 'ALL', status: 'ALL', role: 'ALL' })
  const [debouncedQ, setDebouncedQ] = useState('')

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(filters.q), 350)
    return () => clearTimeout(t)
  }, [filters.q])

  // Load domains once
  useEffect(() => {
    fetch('/api/worker/domains')
      .then((r) => r.json())
      .then((d) => setDomains(d.domains ?? []))
  }, [])

  const loadUsers = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (debouncedQ)                 params.set('q', debouncedQ)
    if (filters.domainId !== 'ALL') params.set('domainId', filters.domainId)
    if (filters.status   !== 'ALL') params.set('status', filters.status)
    if (filters.role     !== 'ALL') params.set('role', filters.role)
    fetch(`/api/worker/users?${params}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.data ?? []))
      .finally(() => setLoading(false))
  }, [debouncedQ, filters.domainId, filters.status, filters.role])

  useEffect(() => { loadUsers() }, [loadUsers])

  function userName(u: User) {
    const full = [u.firstName, u.lastName].filter(Boolean).join(' ')
    return full || u.username || u.email
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Users</h1>
        <span className="text-sm text-muted-foreground">{users.length} result{users.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name / email…"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            className="pl-9"
          />
        </div>
        <Select value={filters.domainId} onValueChange={(v) => setFilters((f) => ({ ...f, domainId: v }))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Domains</SelectItem>
            {domains.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name || d.domain}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="BANNED">Banned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.role} onValueChange={(v) => setFilters((f) => ({ ...f, role: v }))}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="USER">Users</SelectItem>
            <SelectItem value="SUPPORT">Support</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium">Domain</th>
                  <th className="text-left px-4 py-3 font-medium">Balance</th>
                  <th className="text-left px-4 py-3 font-medium">Stakes</th>
                  <th className="text-left px-4 py-3 font-medium">Deposits</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Joined</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading…</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">No users found.</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <p className="font-medium leading-none">{userName(u)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === 'SUPPORT' ? 'outline' : 'secondary'} className="text-xs">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {u.domain ? (
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{u.domain.name || u.domain.domain}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">${Number(u.balance).toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{u._count.stakes}</td>
                    <td className="px-4 py-3 font-mono text-xs">{u._count.deposits}</td>
                    <td className="px-4 py-3">
                      {u.bannedAt
                        ? <Badge variant="destructive" className="text-xs">Banned</Badge>
                        : u.isActive
                          ? <Badge variant="success" className="text-xs">Active</Badge>
                          : <Badge variant="warning" className="text-xs">Inactive</Badge>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/worker/users/${u.id}`} className="text-primary hover:underline text-xs">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
