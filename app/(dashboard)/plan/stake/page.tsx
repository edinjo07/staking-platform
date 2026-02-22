'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, calculateStakingReturns } from '@/lib/utils'
import { TrendingUp, Clock, DollarSign, Calculator } from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
  id: string
  name: string
  description?: string
  dailyRoi: number
  totalRoi: number
  durationDays: number
  minAmount: number
  maxAmount?: number | null
  isFeatured: boolean
}

export default function StakePage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-secondary/30" />}>
      <StakeForm />
    </Suspense>
  )
}

function StakeForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState(searchParams.get('planId') || '')
  const [amount, setAmount] = useState('')
  const [balance, setBalance] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/staking/plans')
      .then((r) => r.json())
      .then((d) => {
        setPlans(d.data || [])
        if (!selectedPlanId && (d.data || []).length > 0) {
          setSelectedPlanId(d.data[0].id)
        }
      })

    fetch('/api/withdraw/balance')
      .then((r) => r.json())
      .then((d) => setBalance(d.data?.balance || 0))
  }, [])

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)
  const numAmount = parseFloat(amount) || 0

  const returns = selectedPlan && numAmount > 0
    ? calculateStakingReturns(numAmount, selectedPlan.dailyRoi, selectedPlan.durationDays)
    : null
  const totalReturn = returns?.totalReturn ?? 0
  const profit = returns?.totalProfit ?? 0

  const handleStake = async () => {
    if (!selectedPlanId || !amount) {
      toast.error('Please select a plan and enter an amount.')
      return
    }
    if (!selectedPlan) return
    if (numAmount < selectedPlan.minAmount) {
      toast.error(`Minimum amount is ${formatCurrency(selectedPlan.minAmount)}`)
      return
    }
    if (selectedPlan.maxAmount && numAmount > selectedPlan.maxAmount) {
      toast.error(`Maximum amount is ${formatCurrency(selectedPlan.maxAmount)}`)
      return
    }
    if (numAmount > balance) {
      toast.error('Insufficient balance.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/staking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlanId, amount: numAmount }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Stake created successfully!')
        router.push('/orders')
      } else {
        toast.error(data.error || 'Failed to create stake.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Create Stake</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Select a plan and amount to start earning.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stake Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stake Details</CardTitle>
            <CardDescription>
              Available:{' '}
              <span className="text-primary font-semibold">{formatCurrency(balance)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Select Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan..." />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.dailyRoi}% daily
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPlan && (
              <div className="rounded-lg bg-secondary/30 p-3 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Daily ROI</span>
                  <span className="text-primary font-semibold">
                    {selectedPlan.dailyRoi}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total ROI</span>
                  <span className="text-green-500 font-semibold">
                    {selectedPlan.totalRoi}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span>{selectedPlan.durationDays} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Min Amount</span>
                  <span>{formatCurrency(selectedPlan.minAmount)}</span>
                </div>
                {selectedPlan.maxAmount && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Max Amount</span>
                    <span>{formatCurrency(selectedPlan.maxAmount)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Investment Amount (USD)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <Button
              onClick={handleStake}
              variant="gradient"
              className="w-full gap-2"
              loading={submitting}
              disabled={
                !selectedPlanId ||
                !amount ||
                numAmount <= 0 ||
                (!!selectedPlan && numAmount < selectedPlan.minAmount) ||
                (!!selectedPlan?.maxAmount && numAmount > selectedPlan.maxAmount) ||
                numAmount > balance
              }
            >
              <TrendingUp className="h-4 w-4" />
              Start Staking
            </Button>
          </CardContent>
        </Card>

        {/* Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Profit Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPlan && numAmount > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary/40 p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Investment</p>
                    <p className="font-bold text-lg">{formatCurrency(numAmount)}</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Total Return</p>
                    <p className="font-bold text-lg text-primary">{formatCurrency(totalReturn)}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-gradient-to-r from-primary/10 to-green-500/10 border border-primary/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Expected Profit</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">+{formatCurrency(profit)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    After {selectedPlan.durationDays} days at {selectedPlan.dailyRoi}% daily
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Matures in {selectedPlan.durationDays} days</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Principal is included in total return</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Select a plan and enter an amount to see profit estimates.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plans overview */}
      {plans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left pb-3 font-medium">Plan</th>
                    <th className="text-left pb-3 font-medium">ROI</th>
                    <th className="text-left pb-3 font-medium">Duration</th>
                    <th className="text-left pb-3 font-medium">Min Amount</th>
                    <th className="text-left pb-3 font-medium">Max Amount</th>
                    <th className="text-left pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {plans.map((p) => (
                    <tr
                      key={p.id}
                      className={`hover:bg-secondary/30 transition-colors cursor-pointer ${
                        p.id === selectedPlanId ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedPlanId(p.id)}
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {p.name}
                          {p.isFeatured && (
                            <Badge variant="success" className="text-xs">Featured</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-primary font-medium">
                        {p.dailyRoi}% daily
                      </td>
                      <td className="py-3">{p.durationDays}d</td>
                      <td className="py-3">{formatCurrency(p.minAmount)}</td>
                      <td className="py-3">
                        {p.maxAmount ? formatCurrency(p.maxAmount) : 'Unlimited'}
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant={p.id === selectedPlanId ? 'gradient' : 'outline'}
                          onClick={(e) => { e.stopPropagation(); setSelectedPlanId(p.id) }}
                        >
                          {p.id === selectedPlanId ? 'Selected' : 'Select'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
