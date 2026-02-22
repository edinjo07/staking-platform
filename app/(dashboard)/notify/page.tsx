import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import {
  Bell, Info, CheckCircle, AlertTriangle, DollarSign,
  TrendingUp, Users, Settings, ArrowUpRight,
} from 'lucide-react'
import { Suspense } from 'react'
import MarkReadButton from './MarkReadButton'
import MarkSingleRead from './MarkSingleRead'
import FilterTabs from './FilterTabs'
import NotifLinkRow from './NotifLinkRow'

export const dynamic = 'force-dynamic'

const iconMap: Record<string, React.ElementType> = {
  SYSTEM:     Settings,
  INFO:       Info,
  SUCCESS:    CheckCircle,
  WARNING:    AlertTriangle,
  DEPOSIT:    DollarSign,
  WITHDRAWAL: DollarSign,
  STAKING:    TrendingUp,
  REFERRAL:   Users,
}

const colorMap: Record<string, string> = {
  SYSTEM:     'text-muted-foreground',
  INFO:       'text-blue-400',
  SUCCESS:    'text-green-400',
  WARNING:    'text-yellow-400',
  DEPOSIT:    'text-primary',
  WITHDRAWAL: 'text-orange-400',
  STAKING:    'text-purple-400',
  REFERRAL:   'text-pink-400',
}

export default async function NotificationPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const session = await requireAuth()
  const { type: typeFilter = '' } = await searchParams

  // Fetch all for counts, filtered list for display
  const [all, filtered] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      select: { type: true, isRead: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
    prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(typeFilter ? { type: typeFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ])

  const unreadCount = all.filter((n) => !n.isRead).length

  // Build per-type counts (keys used in FilterTabs)
  const counts: Record<string, number> = { __total__: all.length }
  for (const n of all) {
    counts[n.type] = (counts[n.type] ?? 0) + 1
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && <MarkReadButton />}
      </div>

      {/* Type filter */}
      <Suspense fallback={null}>
        <FilterTabs counts={counts} />
      </Suspense>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{typeFilter ? `No ${typeFilter.toLowerCase()} notifications.` : 'No notifications yet.'}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((notif) => {
                const Icon = iconMap[notif.type] ?? Bell
                const color = colorMap[notif.type] ?? 'text-muted-foreground'
                const row = (
                  <div
                    className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                      !notif.isRead ? 'bg-primary/5' : 'hover:bg-secondary/20'
                    } ${notif.link ? 'cursor-pointer' : ''}`}
                  >
                    <div className={`mt-0.5 shrink-0 ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${notif.isRead ? 'text-muted-foreground' : ''}`}>
                          {notif.title}
                        </p>
                        <Badge variant="secondary" className="text-[10px] py-0 h-4 capitalize hidden sm:inline-flex">
                          {notif.type.toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-muted-foreground">{formatDateTime(notif.createdAt)}</p>
                        {notif.link && (
                          <span className="text-xs text-primary flex items-center gap-0.5">
                            View <ArrowUpRight className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                    {!notif.isRead && <MarkSingleRead id={notif.id} />}
                  </div>
                )

                return notif.link ? (
                  <NotifLinkRow key={notif.id} href={notif.link} id={notif.id} isRead={notif.isRead}>
                    {row}
                  </NotifLinkRow>
                ) : (
                  <div key={notif.id}>{row}</div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {all.length > 100 && !typeFilter && (
        <p className="text-xs text-center text-muted-foreground">
          Showing 100 most recent notifications of {all.length} total.
        </p>
      )}
    </div>
  )
}
