import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  className?: string
  valueClassName?: string
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  className,
  valueClassName,
}: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0

  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className={cn('text-2xl font-bold tracking-tight', valueClassName)}>{value}</p>

          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  isPositive ? 'text-green-500' : 'text-red-500'
                )}
              >
                {isPositive ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
