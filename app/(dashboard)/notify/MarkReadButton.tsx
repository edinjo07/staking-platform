'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function MarkReadButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const markAll = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' })
      if (res.ok) {
        toast.success('All notifications marked as read.')
        router.refresh()
      } else {
        toast.error('Failed to mark notifications as read.')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={markAll} disabled={loading}>
      {loading ? (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        <CheckCheck className="h-4 w-4" />
      )}
      {loading ? 'Marking...' : 'Mark all as read'}
    </Button>
  )
}
