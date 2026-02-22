'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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

interface Currency {
  id: string
  symbol: string
  name: string
  network: string
  minWithdrawal: number
  maxWithdrawal: number | null
  fee: number
  feeType: string
  isActive: boolean
  iconUrl: string | null
  contractAddress: string | null
  decimals: number
  domainId: string
  domain: Domain
  _count: { withdrawals: number }
}

type FormState = Omit<Currency, 'id' | 'domain' | '_count'>

const emptyForm = (domainId: string): FormState => ({
  symbol: '', name: '', network: '', minWithdrawal: 0,
  maxWithdrawal: null, fee: 0, feeType: 'fixed',
  isActive: true, iconUrl: '', contractAddress: '', decimals: 18,
  domainId,
})

// ---- Component --------------------------------------------------------------

export default function WorkerWithdrawCurrenciesPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [filterDomain, setFilterDomain] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Currency | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm(''))
  const [deleteConfirm, setDeleteConfirm] = useState<Currency | null>(null)

  // Load domains once
  useEffect(() => {
    fetch('/api/worker/domains')
      .then((r) => r.json())
      .then((d) => {
        const list: Domain[] = d.data ?? []
        setDomains(list)
        if (list.length > 0) setForm(emptyForm(list[0].id))
      })
  }, [])

  const loadCurrencies = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterDomain !== 'ALL') params.set('domainId', filterDomain)
    fetch(`/api/worker/currencies/withdrawal?${params}`)
      .then((r) => r.json())
      .then((d) => setCurrencies(d.data ?? []))
      .finally(() => setLoading(false))
  }, [filterDomain])

  useEffect(() => { loadCurrencies() }, [loadCurrencies])

  // ---- Dialog helpers -------------------------------------------------------

  function openCreate() {
    setEditing(null)
    setForm(emptyForm(domains[0]?.id ?? ''))
    setDialogOpen(true)
  }

  function openEdit(c: Currency) {
    setEditing(c)
    const { id: _id, domain: _d, _count: _cnt, ...fields } = c
    setForm(fields)
    setDialogOpen(true)
  }

  // ---- API calls ------------------------------------------------------------

  async function handleSave() {
    if (!form.symbol.trim())  { toast.error('Symbol is required.'); return }
    if (!form.name.trim())    { toast.error('Name is required.'); return }
    if (!form.network.trim()) { toast.error('Network is required.'); return }
    if (!form.domainId)       { toast.error('Select a domain.'); return }
    setSaving(true)
    try {
      const url = editing
        ? `/api/worker/currencies/withdrawal/${editing.id}`
        : '/api/worker/currencies/withdrawal'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          iconUrl:         form.iconUrl?.trim()         || null,
          contractAddress: form.contractAddress?.trim() || null,
          maxWithdrawal:   form.maxWithdrawal ?? null,
        }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || 'Save failed.'); return }
      toast.success(editing ? 'Currency updated.' : 'Currency created.')
      setDialogOpen(false)
      loadCurrencies()
    } finally { setSaving(false) }
  }

  async function handleToggle(c: Currency) {
    const res = await fetch(`/api/worker/currencies/withdrawal/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !c.isActive }),
    })
    if (!res.ok) { toast.error('Toggle failed.'); return }
    toast.success(c.isActive ? 'Currency disabled.' : 'Currency enabled.')
    loadCurrencies()
  }

  async function handleDelete(c: Currency) {
    setDeleting(c.id)
    try {
      const res = await fetch(`/api/worker/currencies/withdrawal/${c.id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || 'Delete failed.'); return }
      toast.success('Currency deleted.')
      setDeleteConfirm(null)
      loadCurrencies()
    } finally { setDeleting(null) }
  }

  // ---- Render ---------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Withdrawal Currencies</h1>
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
            <Plus className="h-4 w-4" /> New Currency
          </Button>
        </div>
      </div>

      {/* Currencies table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Symbol</th>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Domain</th>
                  <th className="text-left px-4 py-3 font-medium">Network</th>
                  <th className="text-left px-4 py-3 font-medium">Min</th>
                  <th className="text-left px-4 py-3 font-medium">Max</th>
                  <th className="text-left px-4 py-3 font-medium">Fee</th>
                  <th className="text-left px-4 py-3 font-medium">Fee Type</th>
                  <th className="text-left px-4 py-3 font-medium">Withdrawals</th>
                  <th className="text-left px-4 py-3 font-medium">Active</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading…</td></tr>
                ) : currencies.length === 0 ? (
                  <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground text-sm">No currencies found. Create a domain first or add one manually.</td></tr>
                ) : currencies.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/20">
                    <td className="px-4 py-3 font-mono font-semibold">{c.symbol}</td>
                    <td className="px-4 py-3">{c.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{c.domain.name || c.domain.domain}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.network}</td>
                    <td className="px-4 py-3 font-mono text-xs">{Number(c.minWithdrawal).toFixed(8)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{c.maxWithdrawal != null ? Number(c.maxWithdrawal).toFixed(8) : '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{Number(c.fee).toFixed(c.feeType === 'percent' ? 2 : 8)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs capitalize">{c.feeType}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{c._count.withdrawals}</td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={c.isActive}
                        onCheckedChange={() => handleToggle(c)}
                        aria-label="Toggle active"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)} title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(c)} title="Delete">
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

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'New'} Withdrawal Currency</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {/* Domain selector (create only) */}
            {!editing && (
              <div className="space-y-1.5">
                <Label>Domain</Label>
                <Select value={form.domainId} onValueChange={(v) => setForm({ ...form, domainId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select domain…" /></SelectTrigger>
                  <SelectContent>
                    {domains.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name || d.domain}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Symbol</Label>
                <Input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="USDT" />
              </div>
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tether" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Network</Label>
              <Input value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })} placeholder="TRC20" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Min Withdrawal</Label>
                <Input type="number" min="0" step="any" value={form.minWithdrawal}
                  onChange={(e) => setForm({ ...form, minWithdrawal: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Withdrawal (blank = unlimited)</Label>
                <Input type="number" min="0" step="any"
                  value={form.maxWithdrawal ?? ''}
                  onChange={(e) => setForm({ ...form, maxWithdrawal: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Unlimited" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fee</Label>
                <Input type="number" min="0" step="any" value={form.fee}
                  onChange={(e) => setForm({ ...form, fee: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label>Fee Type</Label>
                <Select value={form.feeType} onValueChange={(v) => setForm({ ...form, feeType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="percent">Percent (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Contract Address</Label>
                <Input value={form.contractAddress ?? ''} onChange={(e) => setForm({ ...form, contractAddress: e.target.value })} placeholder="0x… (optional)" />
              </div>
              <div className="space-y-1.5">
                <Label>Decimals</Label>
                <Input type="number" min="0" max="36" step="1" value={form.decimals}
                  onChange={(e) => setForm({ ...form, decimals: parseInt(e.target.value) || 18 })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Icon URL</Label>
              <Input value={form.iconUrl ?? ''} onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} placeholder="https://…" />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} id="isActive" />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Currency</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Delete <span className="font-medium text-foreground">{deleteConfirm?.name} ({deleteConfirm?.symbol})</span>?
            {(deleteConfirm?._count.withdrawals ?? 0) > 0 && (
              <span className="block text-destructive mt-1">
                This currency has {deleteConfirm?._count.withdrawals} withdrawal(s) and cannot be deleted.
              </span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!!deleting || (deleteConfirm?._count.withdrawals ?? 0) > 0}
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
