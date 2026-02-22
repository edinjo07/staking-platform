'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, Trash2, Shield } from 'lucide-react'

interface BlockedIP {
  id: string
  ip: string
  reason?: string | null
  blockedAt: string
}

export default function AdminIPBlocklistPage() {
  const [list, setList] = useState<BlockedIP[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ ip: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = async () => {
    const res = await fetch('/api/admin/ip-blocklist')
    const data = await res.json()
    setList(data.data || [])
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.ip.trim()) return toast.error('IP address required.')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/ip-blocklist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.ok) { toast.success('IP blocked.'); setDialogOpen(false); setForm({ ip: '', reason: '' }); load() }
      else toast.error(data.error || 'Failed.')
    } catch { toast.error('Error.') }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove from blocklist?')) return
    const res = await fetch(`/api/admin/ip-blocklist/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Removed.'); load() }
  }

  const filtered = list.filter((b) => b.ip.includes(search) || (b.reason || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">IP Blocklist</h1>
        <Button variant="gradient" className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Block IP</Button>
      </div>

      <Input placeholder="Search IPs or reasons..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">IP Address</th>
                <th className="text-left px-4 py-3 font-medium">Reason</th>
                <th className="text-left px-4 py-3 font-medium">Blocked At</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No blocked IPs.</td></tr>
              )}
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-secondary/20">
                  <td className="px-4 py-3 font-mono flex items-center gap-2"><Shield className="h-4 w-4 text-destructive" />{b.ip}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.reason || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(b.blockedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Block IP Address</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>IP Address</Label><Input value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} placeholder="192.168.1.1" /></div>
            <div className="space-y-1"><Label>Reason (optional)</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} placeholder="Suspicious activity..." /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleCreate} loading={saving}>Block IP</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
