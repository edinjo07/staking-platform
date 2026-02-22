'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { Camera, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Load current profile so fields are pre-populated
  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setFirstName(d.data.firstName || '')
          setLastName(d.data.lastName || '')
          setUsername(d.data.username || '')
          setAvatar(d.data.avatar || '')
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false))
  }, [])

  // Keep avatar in sync if session updates (e.g. after upload)
  useEffect(() => {
    if (session?.user?.avatar) setAvatar(session.user.avatar)
  }, [session?.user?.avatar])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok) {
        setAvatar(data.data.url)
        await update({ avatar: data.data.url })
        toast.success('Avatar updated!')
      } else {
        toast.error(data.error || 'Upload failed.')
      }
    } catch {
      toast.error('Upload failed.')
    }
    setUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Only send non-empty strings so we never wipe existing fields
      const payload: Record<string, string> = {}
      if (firstName.trim()) payload.firstName = firstName.trim()
      if (lastName.trim()) payload.lastName = lastName.trim()
      if (username.trim()) payload.username = username.trim()

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Profile updated!')
        const newName = `${data.data.firstName || firstName} ${data.data.lastName || lastName}`.trim()
        await update({ name: newName })
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to save.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setSaving(false)
  }

  const initials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  if (loadingProfile) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-secondary/50" />
        <div className="h-32 animate-pulse rounded-xl bg-secondary/30" />
        <div className="h-64 animate-pulse rounded-xl bg-secondary/30" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Update your personal information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avatar</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatar} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
            <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="font-medium">{session?.user?.name}</p>
            <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => fileRef.current?.click()}
              loading={uploading}
            >
              Change Avatar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Username</Label>
            <Input
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={session?.user?.email || ''} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
          </div>

          <Button onClick={handleSave} variant="gradient" className="gap-2" loading={saving}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
