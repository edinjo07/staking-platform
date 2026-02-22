'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Bell } from 'lucide-react'

export default function SupportNotificationsPage() {
  const [form, setForm] = useState({ target: 'all', userId: '', type: 'SYSTEM', title: '', message: '' })
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) return toast.error('Title and message required.')
    if (form.target === 'specific' && !form.userId.trim()) return toast.error('User ID required.')
    setSending(true)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.ok) { toast.success(`Sent to ${data.count || 1} user(s).`); setForm({ target: 'all', userId: '', type: 'SYSTEM', title: '', message: '' }) }
      else toast.error(data.error || 'Failed.')
    } catch { toast.error('Error.') }
    setSending(false)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Send Notifications</h1>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />Compose</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1"><Label>Target</Label>
            <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Users</SelectItem><SelectItem value="specific">Specific User</SelectItem></SelectContent>
            </Select>
          </div>
          {form.target === 'specific' && <div className="space-y-1"><Label>User ID</Label><Input value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} placeholder="User UUID" /></div>}
          <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title..." /></div>
          <div className="space-y-1"><Label>Message</Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} /></div>
          <Button variant="gradient" onClick={handleSend} loading={sending} className="w-full">Send</Button>
        </CardContent>
      </Card>
    </div>
  )
}
