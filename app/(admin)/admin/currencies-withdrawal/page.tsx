'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'

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
  iconUrl?: string | null
  contractAddress?: string | null
  decimals: number
}

type FormState = Omit<Currency, 'id'>

const empty: FormState = {
  symbol: '', name: '', network: '', minWithdrawal: 0,
  maxWithdrawal: null, fee: 0, feeType: 'fixed',
  isActive: true, iconUrl: '', contractAddress: '', decimals: 18,
}

export default function AdminWithdrawCurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Currency | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Currency | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/currencies/withdrawal')
      const data = await res.json()
      setCurrencies(data.data || [])
    } catch { toast.error('Failed to load currencies.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openCreate() { setEditing(null); setForm(empty); setDialogOpen(true) }
  function openEdit(c: Currency) {
    setEditing(c)
    setForm({
      symbol: c.symbol, name: c.name, network: c.network,
      minWithdrawal: c.minWithdrawal, maxWithdrawal: c.maxWithdrawal,
      fee: c.fee, feeType: c.feeType, isActive: c.isActive,
      iconUrl: c.iconUrl ?? '', contractAddress: c.contractAddress ?? '', decimals: c.decimals,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.symbol.trim()) { toast.error('Symbol is required.'); return }
    if (!form.name.trim())   { toast.error('Name is required.'); return }
    if (!form.network.trim()){ toast.error('Network is required.'); return }
    setSaving(true)
    try {
      const res = await fetch(
        editing ? `/api/admin/currencies/withdrawal/${editing.id}` : '/api/admin/currencies/withdrawal',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            iconUrl:         form.iconUrl?.trim()         || null,
            contractAddress: form.contractAddress?.trim() || null,
            maxWithdrawal:   form.maxWithdrawal ?? null,
          }),
        }
      )
      const data = await res.json()
      if (res.ok) { toast.success(editing ? 'Currency updated.' : 'Currency created.'); setDialogOpen(false); load() }
      else toast.error(data.error || 'Failed to save.')
    } catch { toast.error('Network error.') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/currencies/withdrawal/${deleteConfirm.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) { toast.success('Currency deleted.'); setDeleteConfirm(null); load() }
      else toast.error(data.error || 'Failed to delete.')
    } catch { toast.error('Network error.') }
    finally { setDeleting(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Withdrawal Currencies</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Global currencies — copied to new domains automatically</p>
        </div>
        <Button variant="gradient" className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Add Currency</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Symbol</th>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Network</th>
                  <th className="text-left px-4 py-3 font-medium">Min</th>
                  <th className="text-left px-4 py-3 font-medium">Max</th>
                  <th className="text-left px-4 py-3 font-medium">Fee</th>
                  <th className="text-left px-4 py-3 font-medium">Fee Type</th>
                  <th className="text-left px-4 py-3 font-medium">Decimals</th>
                  <th className="text-left px-4 py-3 font-medium">Contract</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading…</td></tr>
                ) : currencies.length === 0 ? (
                  <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground text-sm">No withdrawal currencies yet. Click &quot;Add Currency&quot; to create one.</td></tr>
                ) : currencies.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/20">
                    <td className="px-4 py-3 font-mono font-semibold">{c.symbol}</td>
                    <td className="px-4 py-3">{c.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.network}</td>
                    <td className="px-4 py-3 font-mono text-xs">{Number(c.minWithdrawal).toFixed(8)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{c.maxWithdrawal != null ? Number(c.maxWithdrawal).toFixed(8) : '\u2014'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{Number(c.fee).toFixed(c.feeType === 'percent' ? 2 : 8)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs capitalize">{c.feeType}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{c.decimals}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{c.contractAddress || '\u2014'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.isActive ? 'success' : 'warning'} className="text-xs">{c.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(c)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Withdrawal Currency</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
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
            <div className="flex items-center justify-between pt-1">
              <Label>Active</Label>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="gradient" onClick={handleSave} loading={saving}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Currency</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Delete <span className="font-medium text-foreground">{deleteConfirm?.name} ({deleteConfirm?.symbol})</span>?
            This will also remove it from all domains that inherited it.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" loading={deleting} onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
