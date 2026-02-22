'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Globe, Shield, DollarSign, Ban, CheckCircle, Pencil } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

// ---- Types ----------------------------------------------------------------

interface Domain { id: string; domain: string; name: string | null }

interface UserDetail {
  id: string
  email: string
  username: string | null
  firstName: string | null
  lastName: string | null
  role: string
  isActive: boolean
  bannedAt: string | null
  bannedReason: string | null
  balance: number
  twoFaEnabled: boolean
  pinEnabled: boolean
  referralCode: string
  lastLoginAt: string | null
  lastLoginIp: string | null
  createdAt: string
  updatedAt: string
  domain: Domain | null
  _count: { stakes: number; deposits: number; withdrawals: number; transactions: number }
  stakes: Stake[]
  deposits: Deposit[]
  withdrawals: Withdrawal[]
  transactions: Tx[]
}

interface Stake {
  id: string; amount: number; currency: string; status: string
  dailyRoi: number; totalRoi: number; totalEarned: number; expectedReturn: number
  startDate: string; endDate: string; createdAt: string
  plan: { name: string }
}

interface Deposit {
  id: string; amount: number; amountUsd: number | null; status: string
  txHash: string | null; address: string; createdAt: string; confirmedAt: string | null
  currency: { symbol: string; name: string }
}

interface Withdrawal {
  id: string; amount: number; amountUsd: number | null; netAmount: number; fee: number
  status: string; walletAddress: string; txHash: string | null; note: string | null
  createdAt: string; reviewedAt: string | null
  currency: { symbol: string; name: string }
}

interface Tx {
  id: string; type: string; amount: number; currency: string
  status: string; description: string | null; createdAt: string
}

// ---- Helpers ---------------------------------------------------------------

function userName(u: UserDetail) {
  const full = [u.firstName, u.lastName].filter(Boolean).join(' ')
  return full || u.username || u.email
}

function statusLabel(u: UserDetail) {
  if (u.bannedAt) return 'Banned'
  return u.isActive ? 'Active' : 'Inactive'
}

function statusVariant(u: UserDetail): 'destructive' | 'success' | 'warning' {
  if (u.bannedAt) return 'destructive'
  return u.isActive ? 'success' : 'warning'
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

// ---- Component -------------------------------------------------------------

export default function WorkerUserDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [emailDialog, setEmailDialog] = useState(false)
  const [balanceDialog, setBalanceDialog] = useState(false)
  const [banDialog, setBanDialog] = useState(false)

  // Form values
  const [newEmail, setNewEmail] = useState('')
  const [balanceMode, setBalanceMode] = useState<'set' | 'add' | 'subtract'>('add')
  const [balanceAmount, setBalanceAmount] = useState('')
  const [balanceNote, setBalanceNote] = useState('')
  const [banReason, setBanReason] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/worker/users/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return }
        setUser(d.data)
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  // ---- API helpers ----------------------------------------------------------

  async function patch(body: Record<string, unknown>) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/worker/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Error'); return false }
      load()
      return true
    } finally {
      setSaving(false)
    }
  }

  async function patchRole(role: string) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/worker/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Error'); return }
      load()
    } finally {
      setSaving(false)
    }
  }

  // ---- Submit handlers -------------------------------------------------------

  async function submitEmail() {
    if (await patch({ email: newEmail })) { setEmailDialog(false); setNewEmail('') }
  }

  async function submitBalance() {
    const amt = parseFloat(balanceAmount)
    if (isNaN(amt) || amt < 0) { setError('Invalid amount'); return }
    const body: Record<string, unknown> = { note: balanceNote || undefined }
    if (balanceMode === 'set')      body.balanceSet   = amt
    if (balanceMode === 'add')      body.balanceDelta = amt
    if (balanceMode === 'subtract') body.balanceDelta = -amt
    if (await patch(body)) { setBalanceDialog(false); setBalanceAmount(''); setBalanceNote('') }
  }

  async function submitBan() {
    if (await patch({ ban: true, bannedReason: banReason })) { setBanDialog(false); setBanReason('') }
  }

  // ---- Loading / error states ------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <span className="text-muted-foreground text-sm">Loading…</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error || 'User not found.'}</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>Back</Button>
      </div>
    )
  }

  // ---- Render ----------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/worker/users" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold flex-1">{userName(user)}</h1>
        <Badge variant={statusVariant(user)}>{statusLabel(user)}</Badge>
        <Badge variant={user.role === 'SUPPORT' ? 'outline' : 'secondary'} className="uppercase text-xs">
          {user.role}
        </Badge>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm px-4 py-2">{error}</div>
      )}

      {/* Top row: Profile + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Profile */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(
              [
                ['Email',       user.email],
                ['Username',    user.username || '—'],
                ['Role',        user.role],
                ['Domain',      user.domain ? (user.domain.name || user.domain.domain) : '—'],
                ['Balance',     `$${Number(user.balance).toFixed(2)}`],
                ['2FA',         user.twoFaEnabled ? 'Enabled' : 'Disabled'],
                ['PIN',         user.pinEnabled   ? 'Enabled' : 'Disabled'],
                ['Referral',    user.referralCode],
                ['Last login',  fmtDate(user.lastLoginAt)],
                ['Last IP',     user.lastLoginIp || '—'],
                ['Joined',      fmtDate(user.createdAt)],
                ['Updated',     fmtDate(user.updatedAt)],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className="flex justify-between gap-2">
                <span className="text-muted-foreground shrink-0">{label}</span>
                <span className="text-right font-mono text-xs break-all">{value}</span>
              </div>
            ))}
            {user.bannedAt && (
              <>
                <Separator />
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Banned at</span>
                  <span className="text-destructive text-xs">{fmtDate(user.bannedAt)}</span>
                </div>
                {user.bannedReason && (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">Reason</span>
                    <span className="text-xs text-right">{user.bannedReason}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">

            {/* Email */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Email</p>
              <Button size="sm" variant="outline" onClick={() => { setNewEmail(user.email); setEmailDialog(true) }} className="gap-2">
                <Pencil className="h-3 w-3" /> Edit Email
              </Button>
            </div>

            <Separator />

            {/* Balance */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Balance — currently <span className="text-foreground font-mono">${Number(user.balance).toFixed(2)}</span></p>
              <Button size="sm" variant="outline" onClick={() => setBalanceDialog(true)} className="gap-2">
                <DollarSign className="h-3 w-3" /> Manage Balance
              </Button>
            </div>

            <Separator />

            {/* Active toggle */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Account Status</p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={user.isActive ? 'secondary' : 'default'}
                  disabled={saving || !!user.bannedAt}
                  onClick={() => patch({ isActive: !user.isActive })}
                  className="gap-2"
                >
                  <CheckCircle className="h-3 w-3" />
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                {user.bannedAt ? (
                  <Button size="sm" variant="outline" disabled={saving} onClick={() => patch({ ban: false })} className="gap-2">
                    <Ban className="h-3 w-3" /> Unban
                  </Button>
                ) : (
                  <Button size="sm" variant="destructive" disabled={saving} onClick={() => setBanDialog(true)} className="gap-2">
                    <Ban className="h-3 w-3" /> Ban
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Role toggle */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Role</p>
              {user.role === 'SUPPORT' ? (
                <Button size="sm" variant="outline" disabled={saving} onClick={() => patchRole('USER')} className="gap-2">
                  <Shield className="h-3 w-3" /> Revoke Support Role
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled={saving || user.role === 'ADMIN'} onClick={() => patchRole('SUPPORT')} className="gap-2">
                  <Shield className="h-3 w-3" /> Grant Support Role
                </Button>
              )}
            </div>

            {user.domain && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Domain</p>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{user.domain.name || user.domain.domain}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History tabs */}
      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions ({user._count.transactions})</TabsTrigger>
          <TabsTrigger value="stakes">Stakes ({user._count.stakes})</TabsTrigger>
          <TabsTrigger value="deposits">Deposits ({user._count.deposits})</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals ({user._count.withdrawals})</TabsTrigger>
        </TabsList>

        {/* Transactions */}
        <TabsContent value="transactions">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left px-4 py-3 font-medium">Type</th>
                      <th className="text-left px-4 py-3 font-medium">Amount</th>
                      <th className="text-left px-4 py-3 font-medium">Currency</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-left px-4 py-3 font-medium">Description</th>
                      <th className="text-left px-4 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {user.transactions.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">No transactions.</td></tr>
                    ) : user.transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-secondary/20">
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className="text-xs font-mono">{t.type}</Badge>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs">{Number(t.amount).toFixed(2)}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{t.currency}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant={t.status === 'COMPLETED' ? 'success' : 'warning'} className="text-xs">{t.status}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">{t.description || '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stakes */}
        <TabsContent value="stakes">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left px-4 py-3 font-medium">Plan</th>
                      <th className="text-left px-4 py-3 font-medium">Amount</th>
                      <th className="text-left px-4 py-3 font-medium">Earned</th>
                      <th className="text-left px-4 py-3 font-medium">Expected</th>
                      <th className="text-left px-4 py-3 font-medium">Daily ROI</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-left px-4 py-3 font-medium">Start</th>
                      <th className="text-left px-4 py-3 font-medium">End</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {user.stakes.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground text-sm">No stakes.</td></tr>
                    ) : user.stakes.map((s) => (
                      <tr key={s.id} className="hover:bg-secondary/20">
                        <td className="px-4 py-2.5 font-medium">{s.plan.name}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{s.currency} {Number(s.amount).toFixed(2)}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-green-500">{Number(s.totalEarned).toFixed(2)}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{Number(s.expectedReturn).toFixed(2)}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{Number(s.dailyRoi).toFixed(2)}%</td>
                        <td className="px-4 py-2.5">
                          <Badge variant={s.status === 'ACTIVE' ? 'success' : s.status === 'COMPLETED' ? 'secondary' : 'warning'} className="text-xs">{s.status}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(s.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(s.endDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deposits */}
        <TabsContent value="deposits">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left px-4 py-3 font-medium">Currency</th>
                      <th className="text-left px-4 py-3 font-medium">Amount</th>
                      <th className="text-left px-4 py-3 font-medium">USD Value</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-left px-4 py-3 font-medium">Tx Hash</th>
                      <th className="text-left px-4 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {user.deposits.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-sm">No deposits.</td></tr>
                    ) : user.deposits.map((d) => (
                      <tr key={d.id} className="hover:bg-secondary/20">
                        <td className="px-4 py-2.5 font-mono text-xs">{d.currency.symbol}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{Number(d.amount).toFixed(6)}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{d.amountUsd != null ? `$${Number(d.amountUsd).toFixed(2)}` : '—'}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant={d.status === 'CONFIRMED' ? 'success' : d.status === 'PENDING' ? 'warning' : 'destructive'} className="text-xs">{d.status}</Badge>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                          {d.txHash || '—'}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdrawals */}
        <TabsContent value="withdrawals">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left px-4 py-3 font-medium">Currency</th>
                      <th className="text-left px-4 py-3 font-medium">Amount</th>
                      <th className="text-left px-4 py-3 font-medium">Net</th>
                      <th className="text-left px-4 py-3 font-medium">Fee</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-left px-4 py-3 font-medium">Wallet</th>
                      <th className="text-left px-4 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {user.withdrawals.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground text-sm">No withdrawals.</td></tr>
                    ) : user.withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-secondary/20">
                        <td className="px-4 py-2.5 font-mono text-xs">{w.currency.symbol}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{Number(w.amount).toFixed(2)}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{Number(w.netAmount).toFixed(2)}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{Number(w.fee).toFixed(2)}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant={w.status === 'COMPLETED' ? 'success' : w.status === 'PENDING' ? 'warning' : 'destructive'} className="text-xs">{w.status}</Badge>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                          {w.walletAddress}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(w.createdAt), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---- Dialogs ---- */}

      {/* Edit email */}
      <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Edit Email</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>New email address</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialog(false)}>Cancel</Button>
            <Button onClick={submitEmail} disabled={saving || !newEmail.trim()}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Balance management */}
      <Dialog open={balanceDialog} onOpenChange={setBalanceDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Manage Balance</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-2">
              {(['add', 'subtract', 'set'] as const).map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={balanceMode === m ? 'default' : 'outline'}
                  onClick={() => setBalanceMode(m)}
                  className="capitalize"
                >
                  {m}
                </Button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>
                {balanceMode === 'set' ? 'New balance (USD)' : balanceMode === 'add' ? 'Amount to add (USD)' : 'Amount to subtract (USD)'}
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Note (optional)</Label>
              <Input value={balanceNote} onChange={(e) => setBalanceNote(e.target.value)} placeholder="Reason for adjustment…" />
            </div>
            <p className="text-xs text-muted-foreground">
              Current balance: <span className="font-mono text-foreground">${Number(user.balance).toFixed(2)}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialog(false)}>Cancel</Button>
            <Button onClick={submitBalance} disabled={saving || !balanceAmount}>{saving ? 'Saving…' : 'Apply'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban */}
      <Dialog open={banDialog} onOpenChange={setBanDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Ban User</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              This will prevent <span className="text-foreground font-medium">{user.email}</span> from logging in.
            </p>
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Input value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Reason for ban…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={submitBan} disabled={saving}>{saving ? 'Banning…' : 'Ban User'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
