'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import Link from 'next/link'

interface Transaction {
  id: string
  type: string
  amount: number
  currency: string
  status: string
  description: string | null
  referenceId: string | null
  createdAt: string
  user: { id: string; email: string; username: string | null }
}

const TYPE_VARIANTS: Record<string, 'success' | 'info' | 'warning' | 'error' | undefined> = {
  DEPOSIT: 'success',
  WITHDRAWAL: 'warning',
  STAKE: 'info',
  UNSTAKE: 'info',
  STAKING_RETURN: 'success',
  REFERRAL: 'success',
  BONUS: 'success',
  ADJUSTMENT: 'warning',
}

const TYPES = ['ALL', 'DEPOSIT', 'WITHDRAWAL', 'STAKE', 'UNSTAKE', 'STAKING_RETURN', 'REFERRAL', 'BONUS', 'ADJUSTMENT']

export default function AdminPaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')

  useEffect(() => {
    fetch('/api/admin/transactions')
      .then((r) => r.json())
      .then((d) => setTransactions(d.data || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = transactions.filter((t) => {
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      t.user.email.toLowerCase().includes(q) ||
      (t.user.username || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    return matchesType && matchesSearch
  })

  const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Payments / Transactions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} transactions · Total: {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Search user or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t === 'ALL' ? 'All Types' : t}</SelectItem>
              ))}
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
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-left px-4 py-3 font-medium">Amount</th>
                    <th className="text-left px-4 py-3 font-medium">Currency</th>
                    <th className="text-left px-4 py-3 font-medium">Description</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                        No transactions found.
                      </td>
                    </tr>
                  ) : filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/users/${t.user.id}`} className="text-primary text-xs hover:underline">
                          {t.user.username || t.user.email}
                        </Link>
                        <p className="text-xs text-muted-foreground">{t.user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={TYPE_VARIANTS[t.type]} className="text-xs">{t.type}</Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(t.amount)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.currency}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs truncate">{t.description || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={t.status === 'COMPLETED' ? 'success' : 'warning'} className="text-xs">{t.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(t.createdAt)}</td>
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
