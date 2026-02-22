'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Trash2, Wallet } from 'lucide-react'

interface SavedWallet {
  id: string
  label: string | null
  address: string
  network: string
  currency: string | null
}

export default function WithdrawSettingsPage() {
  const [wallets, setWallets] = useState<SavedWallet[]>([])
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const [currency, setCurrency] = useState('BTC')
  const [network, setNetwork] = useState('BTC')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/profile/wallets')
      .then((r) => r.json())
      .then((d) => setWallets(d.data || []))
  }, [])

  const handleAdd = async () => {
    if (!label || !address || !currency || !network) {
      toast.error('Fill in all fields.')
      return
    }
    if (address.trim().length < 10) {
      toast.error('Wallet address is too short.')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/profile/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, address, currency, network }),
      })
      const data = await res.json()
      if (res.ok) {
        setWallets((prev) => [...prev, data.data])
        setLabel('')
        setAddress('')
        toast.success('Wallet added!')
      } else {
        toast.error(data.error || 'Failed to add wallet.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setAdding(false)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/profile/wallets/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setWallets((prev) => prev.filter((w) => w.id !== id))
        toast.success('Wallet removed.')
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to remove wallet.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setDeletingId(null)
  }

  const currencies = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'TRX', 'LTC']
  const networks: Record<string, string[]> = {
    BTC: ['BTC'],
    ETH: ['ERC-20'],
    USDT: ['ERC-20', 'TRC-20', 'BEP-20'],
    USDC: ['ERC-20', 'BEP-20'],
    BNB: ['BEP-20'],
    TRX: ['TRC-20'],
    LTC: ['LTC'],
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Withdrawal Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your saved withdrawal wallets.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Wallet
          </CardTitle>
          <CardDescription>Save frequently used withdrawal addresses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Label</Label>
            <Input placeholder="e.g. My BTC Wallet" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v) => { setCurrency(v); setNetwork(networks[v]?.[0] ?? '') }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Network</Label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {(networks[currency] || []).map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Wallet Address</Label>
            <Input
              placeholder="Enter wallet address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <Button onClick={handleAdd} variant="gradient" className="gap-2" loading={adding}>
            <Plus className="h-4 w-4" />
            Add Wallet
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Saved Wallets ({wallets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {wallets.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No saved wallets yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {wallets.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-4 gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{w.label ?? 'Unnamed'}</p>
                      <Badge variant="info" className="text-xs">{w.currency ?? '—'}</Badge>
                      <Badge variant="warning" className="text-xs">{w.network}</Badge>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">{w.address}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => handleDelete(w.id)}
                    disabled={deletingId === w.id}
                    loading={deletingId === w.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
