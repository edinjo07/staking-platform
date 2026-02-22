'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import AdminWithdrawalActions from './AdminWithdrawalActions'

interface Withdrawal {
  id: string
  amount: number
  amountUsd: number | null
  fee: number
  netAmount: number
  walletAddress: string
  txHash: string | null
  status: string
  note: string | null
  createdAt: Date
  user: {
    email: string
    username: string | null
    firstName: string | null
    lastName: string | null
    domain: { id: string; domain: string; name: string | null } | null
  }
  currency: { symbol: string; network: string }
}

interface Props {
  withdrawals: Withdrawal[]
}

export default function AdminWithdrawalsClient({ withdrawals }: Props) {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [domainFilter, setDomainFilter] = useState('ALL')

  const domains = useMemo(() => {
    const map = new Map<string, string>()
    for (const w of withdrawals) {
      if (w.user.domain) {
        map.set(w.user.domain.id, w.user.domain.name || w.user.domain.domain)
      }
    }
    return Array.from(map.entries())
  }, [withdrawals])

  const filtered = useMemo(() => {
    return withdrawals.filter((w) => {
      if (statusFilter !== 'ALL' && w.status !== statusFilter) return false
      if (domainFilter === 'GLOBAL') {
        if (w.user.domain !== null) return false
      } else if (domainFilter !== 'ALL') {
        if (w.user.domain?.id !== domainFilter) return false
      }
      return true
    })
  }, [withdrawals, statusFilter, domainFilter])

  const pending = filtered.filter((w) => w.status === 'PENDING').length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Withdrawals ({filtered.length} / {withdrawals.length})</h1>
          {pending > 0 && <Badge variant="warning">{pending} Pending</Badge>}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Domains</SelectItem>
              <SelectItem value="GLOBAL">Global (no domain)</SelectItem>
              {domains.map(([id, label]) => (
                <SelectItem key={id} value={id}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Domain</th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Net</th>
                  <th className="text-left px-4 py-3 font-medium">Currency</th>
                  <th className="text-left px-4 py-3 font-medium">Wallet</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No withdrawals found.
                    </td>
                  </tr>
                ) : filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {w.user.firstName && w.user.lastName
                          ? `${w.user.firstName} ${w.user.lastName}`
                          : w.user.username || w.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{w.user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {w.user.domain
                        ? <Badge variant="outline" className="text-xs font-mono">{w.user.domain.name || w.user.domain.domain}</Badge>
                        : <span className="text-xs text-muted-foreground">Global</span>
                      }
                    </td>
                    <td className="px-4 py-3">{formatCurrency(w.amount)}</td>
                    <td className="px-4 py-3 text-primary font-medium">{formatCurrency(w.netAmount)}</td>
                    <td className="px-4 py-3">
                      <p>{w.currency.symbol}</p>
                      <p className="text-xs text-muted-foreground">{w.currency.network}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs max-w-[8rem] truncate">{w.walletAddress}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          w.status === 'COMPLETED' ? 'success' :
                          w.status === 'REJECTED' || w.status === 'FAILED' ? 'error' : 'warning'
                        }
                        className="text-xs"
                      >
                        {w.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(w.createdAt)}</td>
                    <td className="px-4 py-3">
                      {w.status === 'PENDING' && <AdminWithdrawalActions withdrawalId={w.id} />}
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
