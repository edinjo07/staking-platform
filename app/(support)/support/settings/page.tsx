'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Zap, MessageSquare, Bot, Save, Loader2 } from 'lucide-react'

interface QuickReply {
  id: string
  title: string
  content: string
  createdAt: string
}

export default function SupportSettingsPage() {
  // ── Quick Replies ────────────────────────────────────────────────────────────
  const [replies, setReplies] = useState<QuickReply[]>([])
  const [loadingReplies, setLoadingReplies] = useState(true)

  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<QuickReply | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Telegram ─────────────────────────────────────────────────────────────────
  const [telegramChatId, setTelegramChatId] = useState('')
  const [loadingTelegram, setLoadingTelegram] = useState(true)
  const [savingTelegram, setSavingTelegram] = useState(false)

  // ── Load quick replies ────────────────────────────────────────────────────────
  const loadReplies = async () => {
    setLoadingReplies(true)
    try {
      const res = await fetch('/api/support/settings/quick-replies')
      const data = await res.json()
      setReplies(data.data || [])
    } catch {
      toast.error('Failed to load quick replies.')
    } finally {
      setLoadingReplies(false)
    }
  }

  // ── Load telegram ─────────────────────────────────────────────────────────────
  const loadTelegram = async () => {
    setLoadingTelegram(true)
    try {
      const res = await fetch('/api/support/settings/telegram')
      const data = await res.json()
      setTelegramChatId(data.telegramChatId || '')
    } catch {
      toast.error('Failed to load Telegram settings.')
    } finally {
      setLoadingTelegram(false)
    }
  }

  useEffect(() => {
    loadReplies()
    loadTelegram()
  }, [])

  // ── Open add/edit dialog ──────────────────────────────────────────────────────
  const openAdd = () => {
    setFormTitle('')
    setFormContent('')
    setEditTarget(null)
    setAddOpen(true)
  }

  const openEdit = (qr: QuickReply) => {
    setFormTitle(qr.title)
    setFormContent(qr.content)
    setEditTarget(qr)
    setAddOpen(true)
  }

  // ── Save (create or update) ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error('Both title and content are required.')
      return
    }
    setSaving(true)
    try {
      let res: Response
      if (editTarget) {
        res = await fetch(`/api/support/settings/quick-replies/${editTarget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: formTitle, content: formContent }),
        })
      } else {
        res = await fetch('/api/support/settings/quick-replies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: formTitle, content: formContent }),
        })
      }
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed.')
      }
      toast.success(editTarget ? 'Quick reply updated.' : 'Quick reply created.')
      setAddOpen(false)
      loadReplies()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this quick reply?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/support/settings/quick-replies/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete.')
      toast.success('Quick reply deleted.')
      setReplies((prev) => prev.filter((r) => r.id !== id))
    } catch {
      toast.error('Failed to delete.')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Save Telegram ─────────────────────────────────────────────────────────────
  const handleSaveTelegram = async () => {
    setSavingTelegram(true)
    try {
      const res = await fetch('/api/support/settings/telegram', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramChatId: telegramChatId.trim() || null }),
      })
      if (!res.ok) throw new Error('Failed to save.')
      toast.success('Telegram settings saved.')
    } catch {
      toast.error('Failed to save Telegram settings.')
    } finally {
      setSavingTelegram(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="quick-replies">
        <TabsList>
          <TabsTrigger value="quick-replies" className="flex items-center gap-2">
            <Zap className="w-4 h-4" /> Quick Responses
          </TabsTrigger>
          <TabsTrigger value="telegram" className="flex items-center gap-2">
            <Bot className="w-4 h-4" /> Telegram
          </TabsTrigger>
        </TabsList>

        {/* ── Quick Responses ────────────────────────────────────────────────── */}
        <TabsContent value="quick-replies" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Quick Responses
                <Badge variant="secondary" className="ml-1">{replies.length}</Badge>
              </CardTitle>
              <Button size="sm" onClick={openAdd}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingReplies ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
                </div>
              ) : replies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-center text-muted-foreground">
                  <Zap className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No quick responses yet.</p>
                  <p className="text-xs">Add canned responses to speed up chat replies.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {replies.map((qr) => (
                    <div key={qr.id} className="flex items-start justify-between gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{qr.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{qr.content}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(qr)}
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(qr.id)}
                          disabled={deletingId === qr.id}
                          title="Delete"
                        >
                          {deletingId === qr.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground px-1">
            Quick responses appear in the chat panel (⚡ button) allowing one-click insertion into replies.
          </p>
        </TabsContent>

        {/* ── Telegram ──────────────────────────────────────────────────────────── */}
        <TabsContent value="telegram" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-4 h-4" /> Telegram Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-4 pb-5">
              {loadingTelegram ? (
                <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="telegramChatId">Your Telegram Chat ID</Label>
                    <Input
                      id="telegramChatId"
                      placeholder="e.g. 123456789"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                    />
                    {telegramChatId && (
                      <p className="text-xs text-green-600">
                        ✓ Notifications will be sent to chat ID: <strong>{telegramChatId}</strong>
                      </p>
                    )}
                    {!telegramChatId && (
                      <p className="text-xs text-muted-foreground">Leave empty to disable Telegram notifications.</p>
                    )}
                  </div>

                  <Button onClick={handleSaveTelegram} disabled={savingTelegram} size="sm">
                    {savingTelegram ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                    Save
                  </Button>

                  <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2.5 text-sm">
                    <p className="font-medium text-sm">How to get your Telegram Chat ID</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground text-xs leading-relaxed">
                      <li>Open Telegram and search for <strong>@userinfobot</strong></li>
                      <li>Start the bot — it will immediately reply with your numeric chat ID</li>
                      <li>Copy the number (e.g. <code className="bg-background px-1 py-0.5 rounded text-xs">123456789</code>) and paste it above</li>
                      <li>Make sure you have also started a conversation with the platform&apos;s bot so it can send you messages</li>
                    </ol>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Add / Edit Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Quick Response' : 'New Quick Response'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="qr-title">Title</Label>
              <Input
                id="qr-title"
                placeholder="e.g. Greeting"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qr-content">Message Content</Label>
              <Textarea
                id="qr-content"
                placeholder="Type the canned response text…"
                rows={4}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {editTarget ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

