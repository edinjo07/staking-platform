import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-helpers'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { Suspense } from 'react'
import UsersSearchBar from './UsersSearchBar'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>
}) {
  await requireAdmin()
  const { q, role, status } = await searchParams

  const where: Record<string, unknown> = {}
  if (q) {
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { username: { contains: q, mode: 'insensitive' } },
      { firstName: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (role && role !== 'ALL') where.role = role
  if (status === 'BANNED') where.bannedAt = { not: null }
  else if (status === 'ACTIVE') { where.bannedAt = null; where.isActive = true }
  else if (status === 'INACTIVE') { where.bannedAt = null; where.isActive = false }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, email: true, username: true, firstName: true, lastName: true,
      role: true, balance: true, isActive: true, bannedAt: true,
      createdAt: true, lastLoginAt: true,
      _count: { select: { stakes: true, deposits: true } },
    },
    take: 200,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Users ({users.length})</h1>
        <Suspense>
          <UsersSearchBar defaultQ={q} defaultRole={role || 'ALL'} defaultStatus={status || 'ALL'} />
        </Suspense>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium">Balance</th>
                  <th className="text-left px-4 py-3 font-medium">Stakes</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Joined</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No users found.</td>
                  </tr>
                ) : users.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{user.username || `${user.firstName} ${user.lastName}`.trim() || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === 'ADMIN' ? 'error' : user.role === 'WORKER' ? 'warning' : user.role === 'SUPPORT' ? 'info' : undefined} className="text-xs">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(user.balance)}</td>
                    <td className="px-4 py-3">{user._count.stakes}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.bannedAt ? 'error' : user.isActive ? 'success' : 'warning'} className="text-xs">
                        {user.bannedAt ? 'Banned' : user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-primary text-xs hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

