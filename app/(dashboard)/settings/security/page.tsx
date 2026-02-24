'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Shield, Smartphone, Key, Clock } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { SafeImg } from '@/components/shared/SafeImg'

interface LoginRecord {
  id: string
  ipAddress: string
  userAgent?: string | null
  isSuccess: boolean
  createdAt: string
}

export default function SecurityPage() {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const [savingPin, setSavingPin] = useState(false)
  const [pinEnabled, setPinEnabled] = useState(false)
  const [twoFaEnabled, setTwoFaEnabled] = useState(false)
  const [twoFaSecret, setTwoFaSecret] = useState('')
  const [twoFaQr, setTwoFaQr] = useState('')
  const [twoFaCode, setTwoFaCode] = useState('')
  const [enabling2FA, setEnabling2FA] = useState(false)
  const [settingUp2FA, setSettingUp2FA] = useState(false)
  const [disabling2FAFlow, setDisabling2FAFlow] = useState(false)
  const [disableCode, setDisableCode] = useState('')
  const [disabling2FA, setDisabling2FA] = useState(false)
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([])

  useEffect(() => {
    fetch('/api/profile/security')
      .then((r) => r.json())
      .then((d) => {
        setTwoFaEnabled(d.data?.twoFaEnabled || false)
        setPinEnabled(d.data?.pinEnabled || false)
        setLoginHistory(d.data?.loginHistory || [])
      })
  }, [])

  const handleSetPin = async () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast.error('PIN must be exactly 4 digits.')
      return
    }
    if (pin !== confirmPin) {
      toast.error('PINs do not match.')
      return
    }
    if (pinEnabled && (currentPin.length !== 4 || !/^\d{4}$/.test(currentPin))) {
      toast.error('Current PIN must be exactly 4 digits.')
      return
    }
    setSavingPin(true)
    try {
      const res = await fetch('/api/profile/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, ...(pinEnabled ? { currentPin } : {}) }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(pinEnabled ? 'PIN changed!' : 'Withdrawal PIN set!')
        setPin('')
        setConfirmPin('')
        setCurrentPin('')
        setPinEnabled(true)
      } else {
        toast.error(data.error || 'Failed to set PIN.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setSavingPin(false)
  }

  const setup2FA = async () => {
    if (twoFaQr) return // already showing — don't generate another
    setSettingUp2FA(true)
    try {
      const res = await fetch('/api/profile/2fa/setup', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setTwoFaSecret(data.data.secret)
        setTwoFaQr(data.data.qrCode)
      } else {
        toast.error(data.error || 'Failed to set up 2FA.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setSettingUp2FA(false)
  }

  const confirm2FA = async () => {
    if (!/^\d{6}$/.test(twoFaCode)) {
      toast.error('Enter the 6-digit code from your authenticator app.')
      return
    }
    setEnabling2FA(true)
    try {
      const res = await fetch('/api/profile/2fa/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFaCode, secret: twoFaSecret }),
      })
      const data = await res.json()
      if (res.ok) {
        setTwoFaEnabled(true)
        setTwoFaQr('')
        setTwoFaSecret('')
        toast.success('Two-Factor Authentication enabled!')
      } else {
        toast.error(data.error || 'Invalid code.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setEnabling2FA(false)
  }

  const disable2FA = async () => {
    if (!/^\d{6}$/.test(disableCode)) {
      toast.error('Enter the 6-digit code from your authenticator app.')
      return
    }
    setDisabling2FA(true)
    try {
      const res = await fetch('/api/profile/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: disableCode }),
      })
      const data = await res.json()
      if (res.ok) {
        setTwoFaEnabled(false)
        setDisabling2FAFlow(false)
        setDisableCode('')
        toast.success('2FA disabled.')
      } else {
        toast.error(data.error || 'Failed to disable 2FA.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setDisabling2FA(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Security</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account security settings.</p>
      </div>

      {/* PIN */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />
            Withdrawal PIN
          </CardTitle>
          <CardDescription>
            {pinEnabled
              ? 'Your withdrawal PIN is set. Enter your current PIN to change it.'
              : 'Set a 4-digit PIN required for withdrawals.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Status:</span>
            <Badge variant={pinEnabled ? 'success' : 'warning'}>
              {pinEnabled ? 'Set' : 'Not Set'}
            </Badge>
          </div>

          {pinEnabled && (
            <div className="space-y-1.5">
              <Label>Current PIN</Label>
              <Input
                type="password"
                placeholder="Enter current PIN"
                maxLength={4}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>New PIN</Label>
              <Input
                type="password"
                placeholder="4 digits"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm PIN</Label>
              <Input
                type="password"
                placeholder="Re-enter PIN"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleSetPin} variant="gradient" loading={savingPin}>
            {pinEnabled ? 'Change PIN' : 'Set PIN'}
          </Button>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Two-Factor Authentication (2FA)
          </CardTitle>
          <CardDescription>
            Use an authenticator app (Google Authenticator, Authy) for extra security.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              Status:{' '}
              <Badge variant={twoFaEnabled ? 'success' : 'warning'}>
                {twoFaEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </p>
            {twoFaEnabled ? (
              <Button variant="destructive" size="sm" onClick={() => setDisabling2FAFlow(true)} disabled={disabling2FAFlow}>
                Disable 2FA
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={setup2FA} loading={settingUp2FA} disabled={!!twoFaQr}>
                Set up 2FA
              </Button>
            )}
          </div>

          {disabling2FAFlow && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app to confirm disabling 2FA.
              </p>
              <div className="flex gap-3">
                <Input
                  placeholder="6-digit code"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  className="max-w-xs"
                />
                <Button variant="destructive" size="sm" onClick={disable2FA} loading={disabling2FA}>
                  Confirm
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setDisabling2FAFlow(false); setDisableCode('') }}
                  disabled={disabling2FA}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {twoFaQr && (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app:
              </p>
              <SafeImg src={twoFaQr} alt="2FA QR Code" allowDataImage className="w-40 h-40 rounded-lg border border-border" />
              <p className="text-xs text-muted-foreground">
                Or enter this secret manually:{' '}
                <span className="font-mono text-foreground">{twoFaSecret}</span>
              </p>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={twoFaCode}
                  onChange={(e) => setTwoFaCode(e.target.value)}
                  className="max-w-xs"
                />
                <Button onClick={confirm2FA} variant="gradient" loading={enabling2FA}>
                  Verify & Enable
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Login History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loginHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No login history.</p>
          ) : (
            <div className="divide-y divide-border">
              {loginHistory.slice(0, 10).map((record) => (
                <div key={record.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      {record.ipAddress}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">
                      {record.userAgent || 'Unknown device'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDateTime(record.createdAt)}
                    </p>
                  </div>
                  <Badge variant={record.isSuccess ? 'success' : 'error'} className="text-xs shrink-0">
                    {record.isSuccess ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
