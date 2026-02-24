'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageSquare, X, Send, Image, Minimize2 } from 'lucide-react'
import { formatDateTime, sanitizeUrl } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  content: string
  isStaff: boolean
  imageUrl?: string | null
  isRead: boolean
  createdAt: string
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout>()
  // Ref to avoid stale closure inside the polling interval
  const isOpenRef = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat/messages')
      if (res.ok) {
        const data = await res.json()
        setMessages(data.data || [])
        // Use ref so this always reflects the current open state
        if (!isOpenRef.current) {
          const unread = (data.data || []).filter((m: Message) => m.isStaff && !m.isRead).length
          setUnreadCount(unread)
        }
      }
    } catch {}
  }

  useEffect(() => {
    fetchMessages()
    // Poll every 10 seconds for new messages
    pollIntervalRef.current = setInterval(fetchMessages, 10000)
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    isOpenRef.current = isOpen
    if (isOpen) {
      setUnreadCount(0)
      // Mark staff messages as read on the server
      fetch('/api/chat/read', { method: 'PATCH' }).catch(() => {})
      fetchMessages()
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      })
      if (res.ok) {
        setInput('')
        await fetchMessages()
      }
    } catch {}
    setSending(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
    const formData = new FormData()
    formData.append('image', file)
    try {
      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const { data } = await res.json()
        // Send a chat message containing the uploaded image
        await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: data.url }),
        })
        await fetchMessages()
      }
    } catch {}
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 transition-all hover:scale-110 hover:shadow-xl"
        >
          <MessageSquare className="h-6 w-6 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-border bg-background shadow-2xl flex flex-col transition-all duration-300',
            isMinimized ? 'h-14' : 'h-[480px]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border rounded-t-2xl bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Support Chat</p>
                <p className="text-xs text-green-500">Online</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Start a conversation with our support team!
                    </p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn('flex gap-2', msg.isStaff ? 'justify-start' : 'justify-end')}
                  >
                    {msg.isStaff && (
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-primary text-white">S</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                        msg.isStaff
                          ? 'bg-secondary text-foreground rounded-tl-sm'
                          : 'bg-primary text-white rounded-tr-sm'
                      )}
                    >
                      {msg.imageUrl && (
                        <img
                          src={sanitizeUrl(msg.imageUrl)}
                          alt="attachment"
                          className="rounded-lg max-w-full mb-2"
                        />
                      )}
                      {msg.content}
                      <p
                        className={cn(
                          'text-[10px] mt-1',
                          msg.isStaff ? 'text-muted-foreground' : 'text-white/70'
                        )}
                      >
                        {formatDateTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <Image className="h-4 w-4" />
                  </button>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 h-9 text-sm"
                  />
                  <Button
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
