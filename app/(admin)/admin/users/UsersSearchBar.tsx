'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'

export default function UsersSearchBar({ defaultQ = '', defaultRole = 'ALL', defaultStatus = 'ALL' }: {
  defaultQ?: string
  defaultRole?: string
  defaultStatus?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'ALL') params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          defaultValue={defaultQ}
          placeholder="Search name, email, username..."
          className="w-64 pl-8"
          onChange={(e) => {
            const val = e.target.value
            // debounce via a timeout stored on the element
            clearTimeout((e.target as HTMLInputElement & { _t?: ReturnType<typeof setTimeout> })._t)
            ;(e.target as HTMLInputElement & { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(() => update('q', val), 400)
          }}
        />
      </div>
      <Select defaultValue={defaultRole} onValueChange={(v) => update('role', v)}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Roles</SelectItem>
          <SelectItem value="USER">User</SelectItem>
          <SelectItem value="SUPPORT">Support</SelectItem>
          <SelectItem value="WORKER">Worker</SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue={defaultStatus} onValueChange={(v) => update('status', v)}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Status</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="INACTIVE">Inactive</SelectItem>
          <SelectItem value="BANNED">Banned</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
