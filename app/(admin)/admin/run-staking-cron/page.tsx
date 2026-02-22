'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Play, AlertTriangle, CheckCircle, Activity } from 'lucide-react'

interface Result {
  total: number
  processed: number
  completed: number
  errors: string[]
}

export default function RunStakingCronPage() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  const runCron = async () => {
    if (!confirm('Run the staking cron now? This will process all due stakes immediately.')) return
    setRunning(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/run-cron', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
        toast.success(`Processed ${data.processed} of ${data.total} due stakes.`)
      } else {
        toast.error(data.error || 'Failed to run cron.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setRunning(false)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Run Staking Cron</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manual Cron Trigger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Manually triggers the staking cron job. This will process all active stakes whose
            next process time is due, credit user balances with their daily ROI, and mark
            finished stakes as completed.
          </p>
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-400 flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Only run this if the automated cron has not triggered. Running it multiple times within the same day may double-credit users.</span>
          </div>
          <Button
            variant="gradient"
            className="w-full gap-2"
            onClick={runCron}
            disabled={running}
          >
            <Play className="h-4 w-4" />
            {running ? 'Processing…' : 'Run Staking Cron Now'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Last Run Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="text-lg font-bold">{result.total}</p>
                <p className="text-xs text-muted-foreground">Due Stakes</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="text-lg font-bold text-green-400">{result.processed}</p>
                <p className="text-xs text-muted-foreground">Processed</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="text-lg font-bold text-primary">{result.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {result.errors.length} error(s)
                </p>
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-destructive font-mono">{e}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
