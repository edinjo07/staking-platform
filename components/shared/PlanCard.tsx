'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Clock, Flame, Star, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlanCardProps {
  plan: {
    id: string
    name: string
    description?: string | null
    minAmount: number
    maxAmount?: number | null
    durationDays: number
    dailyRoi: number
    totalRoi: number
    isFeatured?: boolean
    iconUrl?: string | null
  }
  isLoggedIn?: boolean
  showActions?: boolean
}

export function PlanCard({ plan, isLoggedIn = false, showActions = true }: PlanCardProps) {
  const isFlexible = plan.durationDays <= 30
  const apr = (plan.dailyRoi * 365).toFixed(2)
  const aprMin = (plan.dailyRoi * 365 * 0.6).toFixed(2)

  return (
    <div
      className={cn(
        'relative rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group',
        plan.isFeatured
          ? 'border-primary/40 bg-gradient-to-b from-primary/10 to-card glow-green'
          : 'border-border bg-card hover:border-primary/30'
      )}
    >
      {/* Top accent line for featured */}
      {plan.isFeatured && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-green-400 to-primary" />
      )}

      {/* Badge tags */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
        {plan.isFeatured && (
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/20 border border-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wide">
            <Flame className="h-2.5 w-2.5" /> Hot
          </span>
        )}
        {plan.totalRoi > 100 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400 uppercase tracking-wide">
            <Star className="h-2.5 w-2.5" /> High Yield
          </span>
        )}
      </div>

      <div className="p-5">
        {/* Header: icon + name */}
        <div className="flex items-center gap-3 mb-5 pr-16">
          <div className={cn(
            'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full',
            plan.isFeatured ? 'bg-primary/20 ring-2 ring-primary/30' : 'bg-secondary'
          )}>
            {plan.iconUrl ? (
              <img src={plan.iconUrl} alt={plan.name} className="h-7 w-7 rounded-full" />
            ) : (
              <TrendingUp className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">{plan.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isFlexible ? (
                <span className="text-[11px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">Flexible</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                  <Lock className="h-2.5 w-2.5" /> Fixed
                </span>
              )}
              <span className="text-[11px] text-muted-foreground">{plan.durationDays} Days</span>
            </div>
          </div>
        </div>

        {/* APR highlight */}
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Est. APR</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-primary">{aprMin}%</span>
            <span className="text-muted-foreground text-sm">~</span>
            <span className="text-2xl font-bold gradient-text">{apr}%</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{plan.dailyRoi}% daily · {plan.totalRoi}% total ROI</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="rounded-lg bg-secondary/60 p-3">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
              <Clock className="h-3 w-3" /> Duration
            </div>
            <p className="text-sm font-semibold">{plan.durationDays} Days</p>
          </div>
          <div className="rounded-lg bg-secondary/60 p-3">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" /> Min Stake
            </div>
            <p className="text-sm font-semibold">{formatCurrency(plan.minAmount)}</p>
          </div>
        </div>

        {/* Daily earn on min deposit */}
        <div className="rounded-lg border border-dashed border-border p-3 mb-4 bg-primary/5 text-center">
          <p className="text-[11px] text-muted-foreground">Daily earn on min. deposit</p>
          <p className="text-base font-bold text-primary mt-0.5">
            +{formatCurrency((plan.minAmount * plan.dailyRoi) / 100)}/day
          </p>
        </div>

        {showActions && (
          isLoggedIn ? (
            <Link href={`/plan/stake?planId=${plan.id}`}>
              <Button variant={plan.isFeatured ? 'gradient' : 'secondary'} className="w-full font-semibold">
                Stake Now
              </Button>
            </Link>
          ) : (
            <Link href="/signup">
              <Button variant={plan.isFeatured ? 'gradient' : 'secondary'} className="w-full font-semibold">
                Get Started
              </Button>
            </Link>
          )
        )}
      </div>
    </div>
  )
}
