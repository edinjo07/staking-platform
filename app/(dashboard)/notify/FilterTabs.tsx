'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

const TYPES = [
  { value: '', label: 'All' },
  { value: 'SYSTEM', label: 'System' },
  { value: 'STAKING', label: 'Staking' },
  { value: 'DEPOSIT', label: 'Deposits' },
  { value: 'WITHDRAWAL', label: 'Withdrawals' },
  { value: 'REFERRAL', label: 'Referrals' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'INFO', label: 'Info' },
  { value: 'WARNING', label: 'Warning' },
]

export default function FilterTabs({ counts }: { counts: Record<string, number> }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('type') ?? ''

  const setType = useCallback(
    (type: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (type) {
        params.set('type', type)
      } else {
        params.delete('type')
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {TYPES.filter((t) => t.value === '' || (counts[t.value] ?? 0) > 0).map((t) => {
        const count = t.value === '' ? counts.__total__ : (counts[t.value] ?? 0)
        const isActive = current === t.value
        return (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              isActive
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
            }`}
          >
            {t.label}
            {count > 0 && (
              <span
                className={`text-[10px] min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 ${
                  isActive ? 'bg-white/20' : 'bg-secondary'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
