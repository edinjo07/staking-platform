'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Send, User, Shield } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface TicketMessage {
  id: string
  content: string
  isStaff: boolean
  createdAt: string
  user: { id: string; username: string | null; firstName: string | null; avatar: string | null; role: string }
}

interface Ticket {
  id: string
  subject: string
  category: string
  status: string
  createdAt: string
  user: { id: string; email: string; username: string | null; firstName: string | null; lastName: string | null }
  messages: TicketMessage[]
}

const STATUS_VARIANTS: Record<string, 'warning' | 'default' | 'success'> = {
  OPEN: 'warning',
  IN_PROGRESS: 'default',
  CLOSED: 'success',
}

export default function SupportTicketDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    const res = await fetch(`/api/admin/tickets/${id}`)
    const data = await res.json()
    if (res.ok) {
      setTicket(data.data)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  useEffect(() => { load() }, [id])

  const handleReply = async () => {
    if (!reply.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
      })
      const data = await res.json()
      if (res.ok) {
        setReply('')
        load()
        toast.success('Reply sent.')
      } else {
        toast.error(data.error || 'Failed.')
      }
    } catch {
      toast.error('Error.')
    }
    setSending(false)
  }

  const handleStatusChange = async (status: string) => {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) { toast.success('Status updated.'); load() }
      else toast.error('Failed.')
    } catch { toast.error('Error.') }
    setUpdatingStatus(false)
  }

  if (!ticket) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/support/tickets" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{ticket.subject}</h1>
          <p className="text-sm text-muted-foreground">
            {ticket.user.username || ticket.user.email} · {ticket.category}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANTS[ticket.status] ?? 'default'} className="text-xs">
            {ticket.status.replace('_', ' ')}
          </Badge>
          <Select value={ticket.status} onValueChange={handleStatusChange} disabled={updatingStatus}>
            <SelectTrigger className="h-7 text-xs w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="py-3 px-4 border-b border-border">
          <CardTitle className="text-sm">{ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {ticket.messages.map((m) => (
            <div key={m.id} className={cn('flex gap-3', m.isStaff ? 'flex-row-reverse' : 'flex-row')}>
              <div className={cn('flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center', m.isStaff ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground')}>
                {m.isStaff ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div className="max-w-[75%] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">
                    {m.isStaff ? 'Support Staff' : (m.user.username || m.user.firstName || 'User')}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className={cn('px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap', m.isStaff ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-secondary text-secondary-foreground rounded-tl-none')}>
                  {m.content}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {ticket.status !== 'CLOSED' ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Textarea
              placeholder="Type your reply..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button variant="gradient" onClick={handleReply} loading={sending} disabled={!reply.trim()} className="gap-2">
                <Send className="h-4 w-4" />
                Send Reply
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="text-center text-sm text-muted-foreground">Ticket is closed. Change status to reply.</p>
      )}
    </div>
  )
}
