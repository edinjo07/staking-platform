'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Globe } from 'lucide-react'
import { toast } from 'sonner'

// ---- Types ------------------------------------------------------------------

interface Domain { id: string; domain: string; name: string | null }

interface Plan {
  id: string
  name: string
  description: string | null
  dailyRoi: number
  totalRoi: number
  durationDays: number
  minAmount: number
  maxAmount: number | null
  isActive: boolean
  isFeatured: boolean
  domainId: string
  domain: Domain
  _count: { stakes: number }
}

type FormState = Omit<Plan, 'id' | 'totalRoi' | 'domain' | '_count'>

const emptyForm = (domainId: string): FormState => ({
  name: '', description: '', dailyRoi: 1, durationDays: 30,
  minAmount: 100, maxAmount: null, isActive: true, isFeatured: false,
  domainId,
})

// ---- Component --------------------------------------------------------------

export default function WorkerStakingPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [filterDomain, setFilterDomain] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm(''))
  const [deleteConfirm, setDeleteConfirm] = useState<Plan | null>(null)

  // Load domains once for dropdowns
  useEffect(() => {
    fetch('/api/worker/domains')
      .then((r) => r.json())
      .then((d) => {
        const list: Domain[] = d.data ?? []
        setDomains(list)
        // Default form domainId to first domain if available
        if (list.length > 0) setForm(emptyForm(list[0].id))
      })
  }, [])

  const loadPlans = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterDomain !== 'ALL') params.set('domainId', filterDomain)
    fetch(`/api/worker/staking/plans?${params}`)
      .then((r) => r.json())
      .then((d) => setPlans(d.data ?? []))
      .finally(() => setLoading(false))
  }, [filterDomain])

  useEffect(() => { loadPlans() }, [loadPlans])

  // ---- Dialog helpers -------------------------------------------------------

  function openCreate() {
    setEditing(null)
    setForm(emptyForm(domains[0]?.id ?? ''))
    setDialogOpen(true)
  }

  function openEdit(p: Plan) {
    setEditing(p)
    const { id: _id, totalRoi: _t, domain: _d, _count: _c, ...fields } = p
    setForm(fields)
    setDialogOpen(true)
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  // ---- API calls ------------------------------------------------------------

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Plan name is required'); return }
    if (!form.domainId)    { toast.error('Select a domain'); return }
    setSaving(true)
    try {
      const url = editing
        ? `/api/worker/staking/plans/${editing.id}`
        : '/api/worker/staking/plans'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || 'Save failed'); return }
      toast.success(editing ? 'Plan updated' : 'Plan created')
      setDialogOpen(false)
      loadPlans()
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(plan: Plan) {
    const res = await fetch(`/api/worker/staking/plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !plan.isActive }),
    })
    if (!res.ok) { toast.error('Toggle failed'); return }
    toast.success(plan.isActive ? 'Plan disabled' : 'Plan enabled')
    loadPlans()
  }

  async function handleDelete(plan: Plan) {
    setDeleting(plan.id)
    try {
      const res = await fetch(`/api/worker/staking/plans/${plan.id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || 'Delete failed'); return }
      toast.success('Plan deleted')
      setDeleteConfirm(null)
      loadPlans()
    } finally {
      setDeleting(null)
    }
  }

  // ---- Render ---------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Staking Plans</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select value={filterDomain} onValueChange={setFilterDomain}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Domains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Domains</SelectItem>
                {domains.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name || d.domain}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> New Plan
          </Button>
        </div>
      </div>

      {/* Plans table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Plan</th>
                  <th className="text-left px-4 py-3 font-medium">Domain</th>
                  <th className="text-left px-4 py-3 font-medium">Daily ROI</th>
                  <th className="text-left px-4 py-3 font-medium">Total ROI</th>
                  <th className="text-left px-4 py-3 font-medium">Duration</th>
                  <th className="text-left px-4 py-3 font-medium">Min</th>
                  <th className="text-left px-4 py-3 font-medium">Max</th>
                  <th className="text-left px-4 py-3 font-medium">Stakes</th>
                  <th className="text-left px-4 py-3 font-medium">Active</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading…</td></tr>
                ) : plans.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground text-sm">No plans found. Create one or create a domain to auto-import global plans.</td></tr>
                ) : plans.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.name}</p>
                      {p.isFeatured && <Badge variant="info" className="text-xs mt-0.5">Featured</Badge>}
                      {p.description && <p className="text-xs text-muted-foreground mt-0.5 max-w-[180px] truncate">{p.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{p.domain.name || p.domain.domain}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{Number(p.dailyRoi).toFixed(2)}%</td>
                    <td className="px-4 py-3 font-mono text-xs text-green-500">{Number(p.totalRoi).toFixed(2)}%</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.durationDays}d</td>
                    <td className="px-4 py-3 font-mono text-xs">${Number(p.minAmount).toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.maxAmount ? `$${Number(p.maxAmount).toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p._count.stakes}</td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={p.isActive}
                        onCheckedChange={() => handleToggle(p)}
                        aria-label="Toggle active"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openEdit(p)}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm(p)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Plan' : 'New Staking Plan'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {/* Domain (create only) */}
            {!editing && (
              <div className="col-span-2 space-y-1.5">
                <Label>Domain</Label>
                <Select value={form.domainId} onValueChange={(v) => setField('domainId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select domain…" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name || d.domain}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="col-span-2 space-y-1.5">
              <Label>Plan Name</Label>
              <Input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. Gold Plan" />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description ?? ''} onChange={(e) => setField('description', e.target.value || null)} placeholder="Optional description" />
            </div>

            <div className="space-y-1.5">
              <Label>Daily ROI (%)</Label>
              <Input type="number" min="0.01" step="0.01" value={form.dailyRoi} onChange={(e) => setField('dailyRoi', parseFloat(e.target.value) || 0)} />
            </div>

            <div className="space-y-1.5">
              <Label>Duration (days)</Label>
              <Input type="number" min="1" step="1" value={form.durationDays} onChange={(e) => setField('durationDays', parseInt(e.target.value) || 0)} />
            </div>

            <div className="space-y-1.5">
              <Label>Min Amount (USD)</Label>
              <Input type="number" min="0.01" step="0.01" value={form.minAmount} onChange={(e) => setField('minAmount', parseFloat(e.target.value) || 0)} />
            </div>

            <div className="space-y-1.5">
              <Label>Max Amount (USD) — leave blank for no limit</Label>
              <Input type="number" min="0.01" step="0.01"
                value={form.maxAmount ?? ''}
                onChange={(e) => setField('maxAmount', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Unlimited"
              />
            </div>

            <div className="col-span-2 border border-border rounded-lg p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview</p>
              <p className="text-sm">
                Total ROI: <span className="font-mono text-green-500">
                  {isNaN(form.dailyRoi * form.durationDays) ? '—' : `${(form.dailyRoi * form.durationDays).toFixed(2)}%`}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setField('isActive', v)} id="isActive" />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isFeatured} onCheckedChange={(v) => setField('isFeatured', v)} id="isFeatured" />
              <Label htmlFor="isFeatured">Featured</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Delete <span className="font-medium text-foreground">{deleteConfirm?.name}</span>?
            {(deleteConfirm?._count.stakes ?? 0) > 0 && (
              <span className="block text-destructive mt-1">
                This plan has {deleteConfirm?._count.stakes} stake(s) and cannot be deleted.
              </span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!!deleting || (deleteConfirm?._count.stakes ?? 0) > 0}
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
