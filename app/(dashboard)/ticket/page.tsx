'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Plus, Send, Paperclip, MessageSquare, ChevronRight } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { SafeImg } from '@/components/shared/SafeImg'

interface Ticket {
  id: string
  subject: string
  category: string
  status: string
  createdAt: string
  updatedAt: string
  _count?: { messages: number }
}

interface TicketMessage {
  id: string
  content: string
  isStaff: boolean
  imageUrl?: string | null
  createdAt: string
  user?: { username?: string | null; firstName?: string | null }
}

export default function TicketPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [imageFile, setImageFile] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newCategory, setNewCategory] = useState('GENERAL')
  const [newMessage, setNewMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadTickets = async () => {
    try {
      const res = await fetch('/api/ticket')
      const data = await res.json()
      if (res.ok) setTickets(data.data || [])
      else toast.error(data.error || 'Failed to load tickets.')
    } catch {
      toast.error('Failed to load tickets.')
    }
  }

  const loadMessages = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/ticket/${ticketId}/messages`)
      const data = await res.json()
      if (res.ok) {
        setMessages(data.data || [])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    } catch {
      // silently ignore polling errors to avoid toast spam
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  // Poll for new messages every 5 s while a ticket is open
  const activeTicketId = activeTicket?.id
  useEffect(() => {
    if (!activeTicketId) return
    loadMessages(activeTicketId)
    const interval = setInterval(() => loadMessages(activeTicketId), 5000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTicketId])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Only images are allowed.'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB.'); return }
    const reader = new FileReader()
    reader.onload = () => setImageFile(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleCreate = async () => {
    if (!newSubject || !newMessage) {
      toast.error('Fill in all fields.')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: newSubject, category: newCategory, message: newMessage }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Ticket created!')
        setCreateOpen(false)
        setNewSubject('')
        setNewMessage('')
        await loadTickets()
        setActiveTicket(data.data)
      } else {
        toast.error(data.error || 'Failed to create ticket.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setCreating(false)
  }

  const handleReply = async () => {
    if (!reply.trim() && !imageFile) return
    if (!activeTicket) return
    setSending(true)
    try {
      const res = await fetch(`/api/ticket/${activeTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply, imageUrl: imageFile || undefined }),
      })
      if (res.ok) {
        setReply('')
        setImageFile(null)
        if (fileRef.current) fileRef.current.value = ''
        await loadMessages(activeTicket.id)
      } else {
        toast.error('Failed to send reply.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setSending(false)
  }

  const statusVariant = (s: string) =>
    s === 'OPEN' ? 'success' : s === 'CLOSED' ? 'error' : s === 'IN_PROGRESS' ? 'warning' : 'info'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground text-sm mt-1">Get help from our support team.</p>
        </div>
        <Button variant="gradient" className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
        {/* Ticket list */}
        <div className="md:col-span-1 border border-border rounded-xl overflow-y-auto divide-y divide-border">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
              <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No tickets yet</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setActiveTicket(ticket)}
                className={`w-full text-left p-4 hover:bg-secondary/30 transition-colors ${
                  activeTicket?.id === ticket.id ? 'bg-secondary/40' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate flex-1">{ticket.subject}</p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(ticket.status)} className="text-xs">
                    {ticket.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(ticket.updatedAt)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Chat area */}
        <div className="md:col-span-2 border border-border rounded-xl flex flex-col overflow-hidden">
          {activeTicket ? (
            <>
              <div className="px-4 py-3 border-b border-border">
                <p className="font-medium">{activeTicket.subject}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant={statusVariant(activeTicket.status)} className="text-xs">
                    {activeTicket.status}
                  </Badge>
                  <Badge variant="info" className="text-xs">{activeTicket.category}</Badge>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isUser = !msg.isStaff
                  return (
                    <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs">
                          {isUser ? 'U' : 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div
                          className={`rounded-xl px-3 py-2 text-sm ${
                            isUser
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary/50 text-foreground'
                          }`}
                        >
                          {msg.content && <p>{msg.content}</p>}
                          {msg.imageUrl && (
                            <SafeImg src={msg.imageUrl} alt="attachment" className="mt-2 max-w-xs rounded-lg" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDateTime(msg.createdAt)}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {activeTicket.status !== 'CLOSED' && (
                <div className="border-t border-border">
                  {imageFile && (
                    <div className="px-3 pt-3">
                      <div className="relative inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageFile} alt="preview" className="h-20 w-20 object-cover rounded-lg border border-border" />
                        <button
                          onClick={() => { setImageFile(null); if (fileRef.current) fileRef.current.value = '' }}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs leading-none"
                        >✕</button>
                      </div>
                    </div>
                  )}
                  <div className="p-3 flex gap-2">
                    <input
                      type="file"
                      ref={fileRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => fileRef.current?.click()}
                      title="Attach image"
                      className={imageFile ? 'text-primary' : ''}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Type a reply..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply()}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="gradient"
                      onClick={handleReply}
                      loading={sending}
                      disabled={!reply.trim() && !imageFile}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">Select a ticket to view messages</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input
                placeholder="Brief description of your issue"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['GENERAL', 'DEPOSIT', 'WITHDRAWAL', 'STAKING', 'ACCOUNT', 'TECHNICAL'].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                placeholder="Describe your issue in detail..."
                rows={4}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="gradient" onClick={handleCreate} loading={creating}>
              Submit Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
