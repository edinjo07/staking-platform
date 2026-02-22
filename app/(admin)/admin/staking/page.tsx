'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Plan {
  id: string
  name: string
  dailyRoi: number
  totalRoi: number
  durationDays: number
  minAmount: number
  maxAmount: number | null
  isActive: boolean
  isFeatured: boolean
}

const empty: Omit<Plan, 'id' | 'totalRoi'> = {
  name: '', dailyRoi: 1, durationDays: 30,
  minAmount: 100, maxAmount: null, isActive: true, isFeatured: false,
}

export default function AdminStakingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [form, setForm] = useState<Omit<Plan, 'id' | 'totalRoi'>>(empty)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await fetch('/api/admin/staking')
    const data = await res.json()
    setPlans(data.data || [])
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(empty); setDialogOpen(true) }
  const openEdit = (p: Plan) => {
    setEditing(p)
    const { totalRoi: _totalRoi, id: _id, ...formFields } = p
    setForm(formFields)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(editing ? `/api/admin/staking/${editing.id}` : '/api/admin/staking', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(editing ? 'Plan updated.' : 'Plan created.')
        setDialogOpen(false)
        load()
      } else {
        toast.error(data.error || 'Failed.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this plan?')) return
    const res = await fetch(`/api/admin/staking/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Deleted.'); load() }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Staking Plans</h1>
        <Button variant="gradient" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Plan
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">ROI</th>
                  <th className="text-left px-4 py-3 font-medium">Duration</th>
                  <th className="text-left px-4 py-3 font-medium">Min / Max</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {plans.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.name}
                        {p.isFeatured && <Badge variant="success" className="text-xs">Featured</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-primary font-medium">{p.dailyRoi}%/day · {p.totalRoi}% total</td>
                    <td className="px-4 py-3">{p.durationDays}d</td>
                    <td className="px-4 py-3">${p.minAmount} / {p.maxAmount ? `$${p.maxAmount}` : '∞'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.isActive ? 'success' : 'warning'} className="text-xs">
                        {p.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Daily ROI (%)</Label>
                <Input type="number" step="0.01" value={form.dailyRoi} onChange={(e) => setForm({ ...form, dailyRoi: parseFloat(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label>Total ROI (computed)</Label>
                <Input readOnly value={`${(form.dailyRoi * form.durationDays).toFixed(2)}%`} className="bg-secondary/30 text-muted-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Duration (days)</Label>
                <Input type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label>Min Amount ($)</Label>
                <Input type="number" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: parseFloat(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label>Max Amount ($)</Label>
                <Input type="number" value={form.maxAmount ?? ''} onChange={(e) => setForm({ ...form, maxAmount: e.target.value ? parseFloat(e.target.value) : null })} placeholder="Unlimited" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Featured</Label>
              <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="gradient" onClick={handleSave} loading={saving}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
