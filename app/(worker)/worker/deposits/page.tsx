'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { CheckCircle, RefreshCw, Loader2 } from 'lucide-react'

interface Domain {
  id: string
  domain: string
  name: string | null
}

interface Deposit {
  id: string
  amount: number
  amountUsd: number | null
  txHash: string | null
  status: string
  confirmations: number
  requiredConfirmations: number
  createdAt: string
  user: {
    email: string
    username: string | null
    firstName: string | null
    lastName: string | null
    domain: { id: string; domain: string; name: string | null } | null
  }
  currency: { symbol: string; network: string }
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function formatDate(s: string) {
  return new Date(s).toLocaleString()
}

export default function WorkerDepositsPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [selectedDomain, setSelectedDomain] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)

  // Load domains once
  useEffect(() => {
    fetch('/api/worker/domains')
      .then((r) => r.json())
      .then((data) => setDomains(Array.isArray(data.domains) ? data.domains : []))
      .catch(() => {})
  }, [])

  // Load deposits when filters or page change
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedDomain !== 'ALL') params.set('domainId', selectedDomain)
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    params.set('page', String(page))

    fetch(`/api/worker/deposits?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setDeposits(Array.isArray(data.deposits) ? data.deposits : [])
        setTotal(data.total ?? 0)
      })
      .catch(() => toast.error('Failed to load deposits.'))
      .finally(() => setLoading(false))
  }, [selectedDomain, statusFilter, page])

  const handleDomainChange = (val: string) => { setSelectedDomain(val); setPage(0) }
  const handleStatusChange = (val: string) => { setStatusFilter(val); setPage(0) }

  const totalPages = Math.ceil(total / 50)

  const handleConfirm = async (id: string) => {
    setConfirming(id)
    try {
      const res = await fetch(`/api/worker/deposits/${id}/confirm`, { method: 'PATCH' })
      if (res.ok) {
        toast.success('Deposit confirmed and balance credited.')
        setDeposits((prev) =>
          prev.map((d) => d.id === id ? { ...d, status: 'CONFIRMED' } : d)
        )
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
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deposits</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} total deposit{total !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedDomain} onValueChange={handleDomainChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All domains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Domains</SelectItem>
              {domains.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name || d.domain}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading deposits…</span>
            </div>
          ) : (
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
                  {deposits.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground text-sm">
                        No deposits found.
                      </td>
                    </tr>
                  ) : deposits.map((d) => (
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
                        {d.user.domain ? (
                          <Badge variant="outline" className="text-xs font-mono">
                            {d.user.domain.name || d.user.domain.domain}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        {formatCurrency(d.amountUsd ?? d.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono">{d.currency.symbol}</p>
                        <p className="text-xs text-muted-foreground">{d.currency.network}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {d.confirmations}/{d.requiredConfirmations}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            d.status === 'CONFIRMED' ? 'success'
                            : d.status === 'FAILED' ? 'error'
                            : 'warning'
                          }
                          className="text-xs"
                        >
                          {d.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(d.createdAt)}
                      </td>
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
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

