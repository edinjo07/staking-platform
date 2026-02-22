'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

/**
 * Wraps a notification row in a Link that also fires mark-as-read
 * before navigating, so unread state is cleared on click.
 */
export default function NotifLinkRow({
  href,
  id,
  isRead,
  children,
}: {
  href: string
  id: string
  isRead: boolean
  children: ReactNode
}) {
  const router = useRouter()

  const handleClick = () => {
    if (!isRead) {
      // fire-and-forget — navigate immediately, refresh after
      fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).then(() =>
        router.refresh(),
      )
    }
  }

  return (
    <Link href={href} onClick={handleClick} className="block">
      {children}
    </Link>
  )
}
