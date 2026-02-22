'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle } from 'lucide-react'

export default function AdminWithdrawalActions({ withdrawalId }: { withdrawalId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState('')

  const doAction = async (action: 'approve' | 'reject') => {
    setLoading(action)
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/${action}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Done.')
        router.refresh()
      } else {
        toast.error(data.error || 'Failed.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setLoading('')
  }

  return (
    <div className="flex gap-1.5">
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-2 gap-1 text-xs text-green-400 border-green-400/30 hover:bg-green-400/10"
        loading={loading === 'approve'}
        onClick={() => doAction('approve')}
      >
        <CheckCircle className="h-3 w-3" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="h-7 px-2 gap-1 text-xs"
        loading={loading === 'reject'}
        onClick={() => doAction('reject')}
      >
        <XCircle className="h-3 w-3" />
        Reject
      </Button>
    </div>
  )
}
