'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import { CheckCircle, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Deposit {
  id: string
  amount: number
  amountUsd: number | null
  txHash: string | null
  status: string
  confirmations: number
  requiredConfirmations: number
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
  deposits: Deposit[]
}

export default function AdminDepositsClient({ deposits }: Props) {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [domainFilter, setDomainFilter] = useState('ALL')
  const [confirming, setConfirming] = useState<string | null>(null)
  const router = useRouter()

  const domains = useMemo(() => {
    const map = new Map<string, string>()
    for (const d of deposits) {
      if (d.user.domain) {
        map.set(d.user.domain.id, d.user.domain.name || d.user.domain.domain)
      }
    }
    return Array.from(map.entries())
  }, [deposits])

  const filtered = useMemo(() => {
    return deposits.filter((d) => {
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false
      if (domainFilter === 'GLOBAL') {
        if (d.user.domain !== null) return false
      } else if (domainFilter !== 'ALL') {
        if (d.user.domain?.id !== domainFilter) return false
      }
      return true
    })
  }, [deposits, statusFilter, domainFilter])

  const handleConfirm = async (id: string) => {
    setConfirming(id)
    try {
      const res = await fetch(`/api/admin/deposits/${id}/confirm`, { method: 'PATCH' })
      if (res.ok) {
        toast.success('Deposit confirmed and balance credited.')
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to confirm deposit.')
      }
    } catch {
      toast.error('Network error.')
    } finally {
      setConfirming(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <h1 className="text-2xl font-bold">Deposits ({filtered.length} / {deposits.length})</h1>
        <div className="flex items-center gap-2">
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
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
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
                  <th className="text-left px-4 py-3 font-medium">Currency</th>
                  <th className="text-left px-4 py-3 font-medium">Confirmations</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">TX Hash</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No deposits found.
                    </td>
                  </tr>
                ) : filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {d.user.firstName && d.user.lastName
                          ? `${d.user.firstName} ${d.user.lastName}`
                          : d.user.username || d.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{d.user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {d.user.domain
                        ? <Badge variant="outline" className="text-xs font-mono">{d.user.domain.name || d.user.domain.domain}</Badge>
                        : <span className="text-xs text-muted-foreground">Global</span>
                      }
                    </td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(d.amountUsd ?? d.amount)}</td>
                    <td className="px-4 py-3">
                      <p>{d.currency.symbol}</p>
                      <p className="text-xs text-muted-foreground">{d.currency.network}</p>
                    </td>
                    <td className="px-4 py-3">
                      {d.confirmations}/{d.requiredConfirmations}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={d.status === 'CONFIRMED' ? 'success' : d.status === 'FAILED' ? 'error' : 'warning'}
                        className="text-xs"
                      >
                        {d.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(d.createdAt)}</td>
                    <td className="px-4 py-3 font-mono text-xs max-w-[8rem] truncate">
                      {d.txHash || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {d.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2 gap-1 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                          onClick={() => handleConfirm(d.id)}
                          disabled={confirming === d.id}
                        >
                          {confirming === d.id
                            ? <RefreshCw className="h-3 w-3 animate-spin" />
                            : <CheckCircle className="h-3 w-3" />
                          }
                          Confirm
                        </Button>
                      )}
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
