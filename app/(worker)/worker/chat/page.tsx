'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Send, MessageSquare, Trash2, UserCircle, X, Zap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface QuickReply {
  id: string
  title: string
  content: string
}

interface Domain {
  id: string
  domain: string
  name: string | null
}

interface ChatUser {
  id: string
  username?: string | null
  firstName: string
  lastName: string
  email?: string
  avatar?: string | null
  balance?: number
  createdAt?: string
  lastMessage?: string
  lastAt?: string
  unreadCount: number
  domain?: { id: string; domain: string; name: string | null } | null
}

interface Message {
  id: string
  content: string
  isStaff: boolean
  createdAt: string
  imageUrl?: string | null
}

export default function WorkerChatPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [domainFilter, setDomainFilter] = useState('ALL')
  const [users, setUsers] = useState<ChatUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load domains once
  useEffect(() => {
    fetch('/api/worker/domains')
      .then((r) => r.json())
      .then((d) => setDomains(Array.isArray(d.domains) ? d.domains : []))
      .catch(() => {})
  }, [])

  // Load quick replies once on mount
  useEffect(() => {
    fetch('/api/support/settings/quick-replies')
      .then((r) => r.json())
      .then((d) => setQuickReplies(d.data || []))
      .catch(() => {})
  }, [])

  const loadUsers = async () => {
    const res = await fetch('/api/worker/chat')
    const data = await res.json()
    setUsers(data.data || [])
  }

  const loadMessages = async (userId: string) => {
    const res = await fetch(`/api/worker/chat/${userId}`)
    const data = await res.json()
    setMessages(data.data || [])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    // Clear unread for this user in local state
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, unreadCount: 0 } : u))
  }

  useEffect(() => { loadUsers() }, [])

  useEffect(() => {
    if (!selectedUser) return
    loadMessages(selectedUser.id)
    const iv = setInterval(() => loadMessages(selectedUser.id), 8000)
    return () => clearInterval(iv)
  }, [selectedUser?.id])

  const filteredUsers = useMemo(() => {
    if (domainFilter === 'ALL') return users
    return users.filter((u) => u.domain?.id === domainFilter)
  }, [users, domainFilter])

  const totalUnread = filteredUsers.reduce((sum, u) => sum + u.unreadCount, 0)

  const handleSend = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || !selectedUser) return
    setSending(true)
    setShowQuickReplies(false)
    try {
      const res = await fetch(`/api/worker/chat/${selectedUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      if (res.ok) {
        setInput('')
        loadMessages(selectedUser.id)
      } else {
        toast.error('Failed to send message.')
      }
    } catch {
      toast.error('Network error.')
    }
    setSending(false)
  }

  const handleDelete = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete all messages for this user?')) return
    setDeleting(userId)
    try {
      const res = await fetch(`/api/worker/chat/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Chat deleted.')
        if (selectedUser?.id === userId) {
          setSelectedUser(null)
          setMessages([])
          setShowProfile(false)
        }
        loadUsers()
      } else {
        toast.error('Failed to delete chat.')
      }
    } catch {
      toast.error('Network error.')
    }
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Live Chat</h1>
          {totalUnread > 0 && <Badge variant="warning">{totalUnread} unread</Badge>}
        </div>
        <Select value={domainFilter} onValueChange={setDomainFilter}>
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
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-220px)]">

        {/* User list — 3 cols */}
        <Card className="col-span-3 flex flex-col overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-border shrink-0">
            <CardTitle className="text-sm font-semibold">
              Chats ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            {filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No active chats</div>
            ) : filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => { setSelectedUser(u); setShowProfile(false) }}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-border hover:bg-secondary/30 transition-colors',
                  selectedUser?.id === u.id && 'bg-secondary/40'
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-medium text-sm truncate">{u.firstName} {u.lastName}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {u.unreadCount > 0 && (
                      <Badge className="text-xs px-1.5 py-0.5 h-auto">{u.unreadCount}</Badge>
                    )}
                    <button
                      onClick={(e) => handleDelete(u.id, e)}
                      disabled={deleting === u.id}
                      className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete chat"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                {u.domain && (
                  <div className="text-[10px] text-primary/70 font-mono mb-0.5">{u.domain.name || u.domain.domain}</div>
                )}
                <div className="text-xs text-muted-foreground truncate">{u.lastMessage || 'No messages'}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Chat panel — 9 cols (or 6 if profile is open) */}
        <div className={cn('flex flex-col gap-0 overflow-hidden', showProfile ? 'col-span-6' : 'col-span-9')}>
          <Card className="flex flex-col h-full overflow-hidden">
            {selectedUser ? (
              <>
                {/* Chat header */}
                <CardHeader className="py-3 px-4 border-b border-border shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </CardTitle>
                      {selectedUser.domain && (
                        <p className="text-xs text-muted-foreground font-mono">{selectedUser.domain.name || selectedUser.domain.domain}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowProfile((v) => !v)}
                        className={cn(
                          'flex items-center gap-1 text-xs transition-colors px-2 py-1 rounded',
                          showProfile
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-primary'
                        )}
                      >
                        <UserCircle className="h-3.5 w-3.5" />
                        Profile
                      </button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">No messages yet</div>
                  )}
                  {messages.map((m) => (
                    <div key={m.id} className={cn('flex', m.isStaff ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-sm px-3 py-2 rounded-2xl text-sm',
                        m.isStaff
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-secondary text-secondary-foreground rounded-bl-none'
                      )}>
                        {m.imageUrl && (
                          <img src={m.imageUrl} alt="attachment" className="rounded-lg max-w-full mb-1" />
                        )}
                        <p>{m.content}</p>
                        <p className="text-[10px] opacity-60 mt-1">
                          {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Quick replies */}
                {showQuickReplies && (
                  <div className="border-t border-border p-3 bg-secondary/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Quick Replies</span>
                      <button onClick={() => setShowQuickReplies(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {quickReplies.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No quick replies configured.
                        </p>
                      )}
                      {quickReplies.map((qr) => (
                        <button
                          key={qr.id}
                          onClick={() => handleSend(qr.content)}
                          title={qr.content}
                          className="text-xs px-2.5 py-1 rounded-full border border-border bg-background hover:bg-secondary transition-colors text-left"
                        >
                          {qr.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t border-border flex gap-2 shrink-0">
                  <button
                    onClick={() => setShowQuickReplies((v) => !v)}
                    className={cn(
                      'p-2 rounded-lg border border-border transition-colors shrink-0',
                      showQuickReplies ? 'bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                    title="Quick replies"
                  >
                    <Zap className="h-4 w-4" />
                  </button>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Type a reply…"
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="gradient"
                    onClick={() => handleSend()}
                    disabled={sending || !input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <MessageSquare className="h-10 w-10 mx-auto opacity-30" />
                  <p className="text-sm">Select a user to start chatting</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Profile panel — 3 cols, only when open */}
        {showProfile && selectedUser && (
          <Card className="col-span-3 flex flex-col overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-border shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">User Profile</CardTitle>
                <button onClick={() => setShowProfile(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4 overflow-y-auto flex-1 space-y-4">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-2 py-2">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt="avatar" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                    <UserCircle className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="text-center">
                  <p className="font-semibold">{selectedUser.firstName} {selectedUser.lastName}</p>
                  {selectedUser.username && (
                    <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                  <p className="font-mono text-xs break-all">{selectedUser.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Balance</p>
                  <p className="font-semibold text-primary">
                    {selectedUser.balance !== undefined
                      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedUser.balance)
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Domain</p>
                  <p>{selectedUser.domain?.name || selectedUser.domain?.domain || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Registered</p>
                  <p className="text-xs">
                    {selectedUser.createdAt
                      ? new Date(selectedUser.createdAt).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

