'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { KeyRound, Plus, Trash2, Copy, AlertTriangle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

const ALL_PERMISSIONS = ['READ', 'WITHDRAW', 'STAKING'] as const
type Permission = (typeof ALL_PERMISSIONS)[number]

interface ApiKeyEntry {
  id: string
  name: string
  keyPrefix: string
  permissions: Permission[]
  isActive: boolean
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [permissions, setPermissions] = useState<Permission[]>(['READ'])
  const [creating, setCreating] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  // Newly created key shown once
  const [newKey, setNewKey] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/profile/api-keys')
      .then((r) => r.json())
      .then((d) => setKeys(d.data || []))
      .finally(() => setLoading(false))
  }, [])

  const togglePermission = (p: Permission) => {
    setPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Enter a name for the API key.')
      return
    }
    if (permissions.length === 0) {
      toast.error('Select at least one permission.')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/profile/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), permissions }),
      })
      const data = await res.json()
      if (res.ok) {
        setNewKey(data.data.key)
        setKeys((prev) => [
          {
            id: data.data.id,
            name: data.data.name,
            keyPrefix: data.data.key.slice(0, 10) + '••••••••••••••••',
            permissions: data.data.permissions,
            isActive: data.data.isActive,
            lastUsedAt: null,
            expiresAt: data.data.expiresAt,
            createdAt: data.data.createdAt,
          },
          ...prev,
        ])
        setName('')
        setPermissions(['READ'])
        toast.success('API key created!')
      } else {
        toast.error(data.error || 'Failed to create API key.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setCreating(false)
  }

  const handleToggle = async (id: string) => {
    setTogglingId(id)
    try {
      const res = await fetch(`/api/profile/api-keys/${id}`, { method: 'PATCH' })
      const data = await res.json()
      if (res.ok) {
        setKeys((prev) =>
          prev.map((k) => (k.id === id ? { ...k, isActive: data.data.isActive } : k))
        )
      } else {
        toast.error(data.error || 'Failed to update key.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setTogglingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this API key? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/profile/api-keys/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setKeys((prev) => prev.filter((k) => k.id !== id))
        toast.success('API key deleted.')
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to delete key.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setDeletingId(null)
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('API key copied to clipboard!')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">API Keys</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage API keys for programmatic access to your account.
        </p>
      </div>

      {/* One-time new key reveal */}
      {newKey && (
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 space-y-3">
          <div className="flex items-start gap-2 text-yellow-400">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">
              Copy your API key now — it will never be shown again.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-background/60 border border-border px-3 py-2">
            <code className="flex-1 text-xs font-mono break-all text-foreground">{newKey}</code>
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => copyKey(newKey)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setNewKey(null)}>
            I&apos;ve saved it
          </Button>
        </div>
      )}

      {/* Create new key */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create API Key
          </CardTitle>
          <CardDescription>Keys grant programmatic access. Keep them secret.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Key Name</Label>
            <Input
              placeholder="e.g. My Trading Bot"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
            />
          </div>

          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_PERMISSIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePermission(p)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    permissions.includes(p)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              READ — view balances/stakes &nbsp;·&nbsp; STAKING — create/manage stakes &nbsp;·&nbsp; WITHDRAW — submit withdrawals
            </p>
          </div>

          <Button
            onClick={handleCreate}
            variant="gradient"
            className="gap-2"
            loading={creating}
            disabled={keys.length >= 10}
          >
            <KeyRound className="h-4 w-4" />
            {keys.length >= 10 ? 'Limit reached (10)' : 'Generate Key'}
          </Button>
        </CardContent>
      </Card>

      {/* Existing keys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Your API Keys ({keys.length}/10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary/30" />
              ))}
            </div>
          ) : keys.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No API keys yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {keys.map((k) => (
                <div key={k.id} className="py-4 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{k.name}</span>
                        <Badge variant={k.isActive ? 'success' : 'warning'} className="text-xs">
                          {k.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {k.expiresAt && new Date(k.expiresAt) < new Date() && (
                          <Badge variant="error" className="text-xs">Expired</Badge>
                        )}
                      </div>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">{k.keyPrefix}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={k.isActive}
                        onCheckedChange={() => handleToggle(k.id)}
                        disabled={togglingId === k.id}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(k.id)}
                        disabled={deletingId === k.id}
                        loading={deletingId === k.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {k.permissions.map((p) => (
                      <span
                        key={p}
                        className="text-xs rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Created {formatDateTime(k.createdAt)}
                    {k.lastUsedAt && ` · Last used ${formatDateTime(k.lastUsedAt)}`}
                    {k.expiresAt && ` · Expires ${formatDateTime(k.expiresAt)}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border bg-secondary/20 p-4 text-xs text-muted-foreground space-y-1.5">
        <p className="font-medium text-foreground">Security Notes</p>
        <ul className="list-disc list-inside space-y-1">
          <li>API keys are shown in full only once — at creation time.</li>
          <li>Never share API keys or commit them to version control.</li>
          <li>Disable a key immediately if you suspect it has been compromised.</li>
          <li>Keys with WITHDRAW permission can initiate withdrawals from your account.</li>
        </ul>
      </div>
    </div>
  )
}
