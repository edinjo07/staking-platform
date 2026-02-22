'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Lock } from 'lucide-react'

export default function PasswordPage() {
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  const handleChange = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.current || !form.newPass || !form.confirm) {
      toast.error('Fill in all fields.')
      return
    }
    if (form.newPass !== form.confirm) {
      toast.error('New passwords do not match.')
      return
    }
    if (form.newPass.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (form.newPass === form.current) {
      toast.error('New password must be different from your current password.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.newPass }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Password changed successfully!')
        setForm({ current: '', newPass: '', confirm: '' })
      } else {
        toast.error(data.error || 'Failed to change password.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Change Password</h1>
        <p className="text-muted-foreground text-sm mt-1">Keep your account secure with a strong password.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Password Settings
          </CardTitle>
          <CardDescription>
            Use at least 8 characters with a mix of letters, numbers, and symbols.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <Input
              type="password"
              placeholder="Enter current password"
              value={form.current}
              onChange={handleChange('current')}
            />
          </div>
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <Input
              type="password"
              placeholder="Enter new password"
              value={form.newPass}
              onChange={handleChange('newPass')}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              placeholder="Confirm new password"
              value={form.confirm}
              onChange={handleChange('confirm')}
            />
          </div>

          <Button onClick={handleSave} variant="gradient" className="w-full" loading={saving}>
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
