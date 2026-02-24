'use client'

import { useState, useEffect, useCallback } from 'react'
import { sanitizeUrl } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Globe, Users, TrendingUp, Wallet, Edit2, Save, X,
  BarChart2, Mail, Image, UserCheck,
} from 'lucide-react'

interface DomainStats {
  users: number
  totalDeposits: number
  totalWithdrawals: number
  activeStakes: number
}

interface StaffMember {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  role: string
}

interface DomainData {
  id: string
  domain: string
  name: string | null
  logoUrl: string | null
  supportEmail: string | null
  isActive: boolean
  createdAt: string
  stats: DomainStats
  staff: StaffMember[]
}

export default function WorkerDomainsPage() {
  const [data, setData] = useState<DomainData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', logoUrl: '', supportEmail: '' })

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/worker/domains')
      const json = await res.json()
      if (res.ok) {
        setData(json.data)
        setForm({
          name: json.data.name || '',
          logoUrl: json.data.logoUrl || '',
          supportEmail: json.data.supportEmail || '',
        })
      } else {
        toast.error(json.error || 'Failed to load domain.')
      }
    } catch {
      toast.error('Failed to load domain.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const cancelEdit = () => {
    if (!data) return
    setEditing(false)
    setForm({ name: data.name || '', logoUrl: data.logoUrl || '', supportEmail: data.supportEmail || '' })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/worker/domains', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (res.ok) {
        toast.success('Domain settings saved.')
        setEditing(false)
        load()
      } else {
        toast.error(json.error || 'Failed to save.')
      }
    } catch {
      toast.error('Error saving.')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm">Loading domain...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <Globe className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No domain assigned to your account.</p>
          <p className="text-xs text-muted-foreground">Contact an administrator to assign a domain.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {data.logoUrl ? (
            <img src={sanitizeUrl(data.logoUrl)} alt="logo" className="h-10 w-10 rounded-lg object-cover border border-border" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{data.name || data.domain}</h1>
            <p className="text-sm text-muted-foreground">{data.domain}</p>
          </div>
          <Badge variant={data.isActive ? 'success' : 'warning'} className="text-xs ml-2">
            {data.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        {!editing ? (
          <Button variant="outline" className="gap-2" onClick={() => setEditing(true)}>
            <Edit2 className="h-4 w-4" /> Edit Settings
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" className="gap-2" onClick={cancelEdit}>
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button variant="gradient" className="gap-2" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Users</p>
              <p className="text-xl font-bold">{data.stats.users.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Deposits</p>
              <p className="text-xl font-bold">
                ${data.stats.totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg flex-shrink-0">
              <Wallet className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Withdrawals</p>
              <p className="text-xl font-bold">
                ${data.stats.totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
              <BarChart2 className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Stakes</p>
              <p className="text-xl font-bold">{data.stats.activeStakes.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Domain Settings */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Domain Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Domain URL</Label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 rounded-md text-sm">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    {data.domain}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Added</Label>
                  <div className="px-3 py-2 bg-secondary/30 rounded-md text-sm">
                    {new Date(data.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                {editing ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1.5 text-sm">
                        <Globe className="h-3.5 w-3.5" /> Website Name
                      </Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="My Platform"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1.5 text-sm">
                        <Image className="h-3.5 w-3.5" /> Logo URL
                      </Label>
                      <Input
                        value={form.logoUrl}
                        onChange={(e) => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                        placeholder="https://example.com/logo.png"
                      />
                      {form.logoUrl && (
                        <img
                          src={form.logoUrl}
                          alt="preview"
                          className="mt-2 h-12 w-12 rounded-lg object-cover border border-border"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1.5 text-sm">
                        <Mail className="h-3.5 w-3.5" /> Support Email
                      </Label>
                      <Input
                        type="email"
                        value={form.supportEmail}
                        onChange={(e) => setForm(f => ({ ...f, supportEmail: e.target.value }))}
                        placeholder="support@example.com"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between py-2.5 border-b border-border/50">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5" /> Website Name
                      </span>
                      <span className="text-sm font-medium">
                        {data.name || <span className="text-muted-foreground italic">Not set</span>}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 border-b border-border/50">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Image className="h-3.5 w-3.5" /> Logo
                      </span>
                      {data.logoUrl ? (
                        <img src={sanitizeUrl(data.logoUrl)} alt="logo" className="h-8 w-8 rounded object-cover border border-border" />
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Not set</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" /> Support Email
                      </span>
                      <span className="text-sm font-medium">
                        {data.supportEmail || <span className="text-muted-foreground italic">Not set</span>}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Staff */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Assigned Staff
                <Badge variant="secondary" className="ml-auto text-xs">{data.staff.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.staff.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">No staff assigned to this domain.</p>
              ) : (
                <div className="divide-y divide-border">
                  {data.staff.map((s) => (
                    <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {s.firstName ? `${s.firstName} ${s.lastName || ''}`.trim() : s.email}
                        </p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                      <Badge
                        variant={s.role === 'WORKER' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {s.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
