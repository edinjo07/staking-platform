'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

interface Ticket {
  id: string
  subject: string
  category: string
  status: string
  createdAt: string
  updatedAt: string
  user: { id: string; email: string; username: string | null; firstName: string | null; lastName: string | null }
  _count: { messages: number }
}

const STATUS_VARIANTS: Record<string, 'warning' | 'default' | 'success'> = {
  OPEN: 'warning',
  IN_PROGRESS: 'default',
  CLOSED: 'success',
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (search) params.set('q', search)
    const res = await fetch(`/api/admin/tickets?${params}`)
    const data = await res.json()
    setTickets(data.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter])

  const openCount = tickets.filter((t) => t.status === 'OPEN').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          {openCount > 0 && <Badge variant="warning">{openCount} Open</Badge>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Search subject, user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            className="w-52"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
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
                  <th className="text-left px-4 py-3 font-medium">Subject</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Msgs</th>
                  <th className="text-left px-4 py-3 font-medium">Updated</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading...</td></tr>
                ) : tickets.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No tickets found.</td></tr>
                ) : tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm">{t.user.username || `${t.user.firstName ?? ''} ${t.user.lastName ?? ''}`.trim() || t.user.email}</p>
                      <p className="text-xs text-muted-foreground">{t.user.email}</p>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate font-medium">{t.subject}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{t.category}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANTS[t.status] ?? 'default'} className="text-xs">{t.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {t._count.messages}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(t.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/support/tickets/${t.id}`} className="text-primary hover:underline text-xs">View / Reply</Link>
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
