'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Mail } from 'lucide-react'

export default function AdminBulkEmailPage() {
  const [form, setForm] = useState({ target: 'all', subject: '', body: '' })
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!form.subject.trim() || !form.body.trim()) return toast.error('Subject and body required.')
    setSending(true)
    try {
      const res = await fetch('/api/admin/bulk-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.ok) toast.success(`Email sent to ${data.count || 0} user(s).`)
      else toast.error(data.error || 'Failed.')
    } catch { toast.error('Error.') }
    setSending(false)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Bulk Email</h1>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" />Compose Email</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Target</Label>
            <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active Users Only</SelectItem>
                <SelectItem value="verified">Email Verified Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Subject</Label>
            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Email subject..." />
          </div>
          <div className="space-y-1">
            <Label>Body (HTML or plain text)</Label>
            <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={8} placeholder="<p>Hello,</p><p>Your message here…</p>" className="font-mono text-xs" />
          </div>
          <Button variant="gradient" onClick={handleSend} loading={sending} className="w-full">Send Email</Button>
        </CardContent>
      </Card>
    </div>
  )
}
