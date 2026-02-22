'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

export default function MarkSingleRead({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const mark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={mark}
      disabled={loading}
      title="Mark as read"
      className="mt-1 h-5 w-5 rounded-full bg-primary shrink-0 flex items-center justify-center hover:bg-primary/80 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <span className="h-2.5 w-2.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
      ) : (
        <Check className="h-2.5 w-2.5 text-white" />
      )}
    </button>
  )
}
