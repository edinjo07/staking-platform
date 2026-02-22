'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Trash2, Globe, Pencil, Users } from 'lucide-react'

interface Domain {
  id: string
  domain: string
  name: string | null
  logoUrl: string | null
  supportEmail: string | null
  isActive: boolean
  createdAt: string
  _count: { users: number }
}

const emptyEdit = { name: '', logoUrl: '', supportEmail: '' }

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  // Edit state
  const [editDomain, setEditDomain] = useState<Domain | null>(null)
  const [editForm, setEditForm] = useState(emptyEdit)
  const [editSaving, setEditSaving] = useState(false)

  const load = async () => {
    const res = await fetch('/api/admin/domains')
    const data = await res.json()
    setDomains(data.data || [])
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!newDomain.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim(), name: newName.trim() || undefined }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Domain added.'); setAddOpen(false); setNewDomain(''); setNewName(''); load() }
      else toast.error(data.error || 'Failed.')
    } catch { toast.error('Error.') }
    setSaving(false)
  }

  const handleToggle = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/domains/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    })
    if (res.ok) { toast.success('Updated.'); load() }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this domain? This cannot be undone.')) return
    const res = await fetch(`/api/admin/domains/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Deleted.'); load() }
    else toast.error('Failed to delete domain.')
  }

  const openEdit = (d: Domain) => {
    setEditDomain(d)
    setEditForm({ name: d.name || '', logoUrl: d.logoUrl || '', supportEmail: d.supportEmail || '' })
  }

  const handleEditSave = async () => {
    if (!editDomain) return
    setEditSaving(true)
    try {
      const res = await fetch(`/api/admin/domains/${editDomain.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Domain updated.'); setEditDomain(null); load() }
      else toast.error(data.error || 'Failed.')
    } catch { toast.error('Error.') }
    setEditSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Domain Management</h1>
        <Button variant="gradient" className="gap-2" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add Domain</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Domain</th>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Logo</th>
                <th className="text-left px-4 py-3 font-medium">Support Email</th>
                <th className="text-left px-4 py-3 font-medium"><Users className="h-3.5 w-3.5 inline mr-1" />Users</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Added</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {domains.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No domains found.</td></tr>
              )}
              {domains.map((d) => (
                <tr key={d.id} className="hover:bg-secondary/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">{d.domain}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{d.name || '—'}</td>
                  <td className="px-4 py-3">
                    {d.logoUrl
                      ? <img src={d.logoUrl} alt="logo" className="h-7 w-7 rounded object-cover border border-border" />
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{d.supportEmail || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">{d._count?.users ?? 0}</Badge>
                  </td>
                  <td className="px-4 py-3"><Badge variant={d.isActive ? 'success' : 'warning'} className="text-xs">{d.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={d.isActive} onCheckedChange={() => handleToggle(d.id, d.isActive)} />
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(d)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(d.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add Domain Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Domain</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Domain <span className="text-destructive">*</span></Label>
              <Input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="example.com" />
            </div>
            <div className="space-y-1">
              <Label>Display Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My Platform" onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="gradient" onClick={handleCreate} disabled={saving}>{saving ? 'Adding...' : 'Add Domain'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Domain Dialog */}
      <Dialog open={!!editDomain} onOpenChange={(o) => !o && setEditDomain(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Domain</DialogTitle>
            {editDomain && <p className="text-sm text-muted-foreground mt-1">{editDomain.domain}</p>}
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Website Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="My Platform" />
            </div>
            <div className="space-y-1">
              <Label>Logo URL</Label>
              <Input value={editForm.logoUrl} onChange={(e) => setEditForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://example.com/logo.png" />
              {editForm.logoUrl && (
                <img
                  src={editForm.logoUrl}
                  alt="preview"
                  className="mt-2 h-12 w-12 rounded-lg object-cover border border-border"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
            </div>
            <div className="space-y-1">
              <Label>Support Email</Label>
              <Input type="email" value={editForm.supportEmail} onChange={(e) => setEditForm(f => ({ ...f, supportEmail: e.target.value }))} placeholder="support@example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDomain(null)}>Cancel</Button>
            <Button variant="gradient" onClick={handleEditSave} disabled={editSaving}>{editSaving ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await fetch('/api/admin/domains')
    const data = await res.json()
    setDomains(data.data || [])
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!newDomain.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/domains', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: newDomain.trim(), name: newName.trim() || undefined })
      })
      const data = await res.json()
          if (res.ok) { toast.success('Domain added.'); setDialogOpen(false); setNewDomain(''); setNewName(''); load() }
      else toast.error(data.error || 'Failed.')
    } catch { toast.error('Error.') }
    setSaving(false)
  }

  const handleToggle = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/domains/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !current })
    })
    if (res.ok) { toast.success('Updated.'); load() }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this domain?')) return
    const res = await fetch(`/api/admin/domains/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Deleted.'); load() }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Domain Management</h1>
        <Button variant="gradient" className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Add Domain</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Domain</th>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Added</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {domains.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No domains found.</td></tr>
              )}
              {domains.map((d) => (
                <tr key={d.id} className="hover:bg-secondary/20">
                  <td className="px-4 py-3 flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" />{d.domain}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{d.name || '—'}</td>
                  <td className="px-4 py-3"><Badge variant={d.isActive ? 'success' : 'warning'} className="text-xs">{d.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Switch checked={d.isActive} onCheckedChange={() => handleToggle(d.id, d.isActive)} />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(d.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Domain</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Domain</Label>
              <Input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="example.com" />
            </div>
            <div className="space-y-1">
              <Label>Display Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My Platform" onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="gradient" onClick={handleCreate} loading={saving}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
