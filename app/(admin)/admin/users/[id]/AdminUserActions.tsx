'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { BadgeDollarSign, Ban, CheckCircle, UserCog } from 'lucide-react'

interface Props {
  user: { id: string; isActive: boolean; bannedAt: string | null; balance: number; role?: string }
}

export default function AdminUserActions({ user }: Props) {
  const router = useRouter()
  const [adjustAmount, setAdjustAmount] = useState('')
  const [loading, setLoading] = useState('')
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState(user.role ?? 'USER')

  const doAction = async (action: string, extra?: object) => {
    setLoading(action)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extra || {}),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Done.')
        router.refresh()
      } else {
        toast.error(data.error || 'Action failed.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setLoading('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserCog className="h-4 w-4" />
          Admin Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">Balance: {formatCurrency(user.balance)}</p>

        <div className="space-y-2">
          <Label className="text-xs">Adjust Balance (USD)</Label>
          <Input
            type="number"
            placeholder="e.g. 100 or -50"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            className="h-8 text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1.5 h-8 text-xs"
            loading={loading === 'adjust-balance'}
            onClick={() => doAction('adjust-balance', { amount: parseFloat(adjustAmount) })}
          >
            <BadgeDollarSign className="h-3.5 w-3.5" />
            Adjust Balance
          </Button>
        </div>

        <div className="border-t border-border pt-3 space-y-2">
          {user.bannedAt ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5 h-8 text-xs text-green-400 border-green-400/30 hover:bg-green-400/10"
              loading={loading === 'unban'}
              onClick={() => doAction('unban')}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Unban User
            </Button>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              className="w-full gap-1.5 h-8 text-xs"
              loading={loading === 'ban'}
              onClick={() => doAction('ban')}
            >
              <Ban className="h-3.5 w-3.5" />
              Ban User
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1.5 h-8 text-xs"
            loading={loading === 'toggle-active'}
            onClick={() => doAction('toggle-active')}
          >
            {user.isActive ? 'Deactivate Account' : 'Activate Account'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1.5 h-8 text-xs"
            onClick={() => setRoleDialogOpen(true)}
          >
            <UserCog className="h-3.5 w-3.5" />
            Change Role
          </Button>
        </div>
      </CardContent>

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Role</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="USER">User</option>
                <option value="SUPPORT">Support</option>
                <option value="WORKER">Worker</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
            <Button
              variant="gradient"
              loading={loading === 'change-role'}
              onClick={async () => {
                await doAction('change-role', { role: selectedRole })
                setRoleDialogOpen(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
