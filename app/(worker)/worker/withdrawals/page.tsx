'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface Domain {
  id: string
  domain: string
  name: string | null
}

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

export default function WorkerWithdrawalsPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [selectedDomain, setSelectedDomain] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState<string | null>(null)

  // Load domains once
  useEffect(() => {
    fetch('/api/worker/domains')
      .then((r) => r.json())
      .then((data) => setDomains(Array.isArray(data.domains) ? data.domains : []))
      .catch(() => {})
  }, [])

  // Load withdrawals when filters or page change
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedDomain !== 'ALL') params.set('domainId', selectedDomain)
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    params.set('page', String(page))

    fetch(`/api/worker/withdrawals?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setWithdrawals(Array.isArray(data.withdrawals) ? data.withdrawals : [])
        setTotal(data.total ?? 0)
      })
      .catch(() => toast.error('Failed to load withdrawals.'))
      .finally(() => setLoading(false))
  }, [selectedDomain, statusFilter, page])

  const handleDomainChange = (val: string) => { setSelectedDomain(val); setPage(0) }
  const handleStatusChange = (val: string) => { setStatusFilter(val); setPage(0) }

  const totalPages = Math.ceil(total / 50)
  const pending = withdrawals.filter((w) => w.status === 'PENDING').length

  const doAction = async (id: string, action: 'approve' | 'reject') => {
    setActing(`${id}-${action}`)
    try {
      const res = await fetch(`/api/worker/withdrawals/${id}/${action}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Done.')
        const newStatus = action === 'approve' ? 'COMPLETED' : 'REJECTED'
        setWithdrawals((prev) =>
          prev.map((w) => w.id === id ? { ...w, status: newStatus } : w)
        )
      } else {
        toast.error(data.error || 'Action failed.')
      }
    } catch {
      toast.error('Network error.')
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">Withdrawals</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {total} total withdrawal{total !== 1 ? 's' : ''}
            </p>
          </div>
          {pending > 0 && <Badge variant="warning">{pending} Pending</Badge>}
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
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
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
              <span className="text-sm">Loading withdrawals…</span>
            </div>
          ) : (
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
                  {withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground text-sm">
                        No withdrawals found.
                      </td>
                    </tr>
                  ) : withdrawals.map((w) => (
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
                        {w.user.domain ? (
                          <Badge variant="outline" className="text-xs font-mono">
                            {w.user.domain.name || w.user.domain.domain}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(w.amount)}</td>
                      <td className="px-4 py-3 text-primary font-medium whitespace-nowrap">{formatCurrency(w.netAmount)}</td>
                      <td className="px-4 py-3">
                        <p className="font-mono">{w.currency.symbol}</p>
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
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(w.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {w.status === 'PENDING' && (
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 gap-1 text-xs text-green-400 border-green-400/30 hover:bg-green-400/10"
                              disabled={acting !== null}
                              onClick={() => doAction(w.id, 'approve')}
                            >
                              {acting === `${w.id}-approve`
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <CheckCircle className="h-3 w-3" />
                              }
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 px-2 gap-1 text-xs"
                              disabled={acting !== null}
                              onClick={() => doAction(w.id, 'reject')}
                            >
                              {acting === `${w.id}-reject`
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <XCircle className="h-3 w-3" />
                              }
                              Reject
                            </Button>
                          </div>
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

