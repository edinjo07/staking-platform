'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Log {
  id: string
  level: string
  context?: string | null
  message: string
  userId?: string | null
  ip?: string | null
  createdAt: string
  meta?: any
}

const levelColors: Record<string, string> = {
  info: 'bg-blue-500/20 text-blue-400',
  warn: 'bg-yellow-500/20 text-yellow-400',
  error: 'bg-red-500/20 text-red-400',
  debug: 'bg-gray-500/20 text-gray-400',
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [level, setLevel] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (level !== 'all') params.set('level', level)
    if (search) params.set('q', search)
    const res = await fetch(`/api/admin/logs?${params}`)
    const data = await res.json()
    setLogs(data.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [level])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Logs</h1>
        <Button variant="outline" size="sm" onClick={load} className="gap-2"><RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />Refresh</Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
        </div>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warn">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="debug">Debug</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium">Time</th>
                <th className="text-left px-4 py-3 font-medium">Level</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Message</th>
                <th className="text-left px-4 py-3 font-medium">IP</th>
                <th className="text-left px-4 py-3 font-medium">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {logs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground font-sans">No logs found.</td></tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-secondary/10">
                  <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2"><span className={cn('text-xs px-1.5 py-0.5 rounded', levelColors[log.level] || levelColors.INFO)}>{log.level}</span></td>
                  <td className="px-4 py-2 text-xs">{log.context || '-'}</td>
                  <td className="px-4 py-2 text-xs max-w-sm truncate">{log.message}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{log.ip || '-'}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{log.userId ? log.userId.slice(0, 8) + '…' : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
