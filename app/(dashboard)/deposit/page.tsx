'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate, formatDateTime, truncateAddress } from '@/lib/utils'
import { Copy, QrCode, RefreshCw, ArrowDownToLine } from 'lucide-react'
import { toast } from 'sonner'

interface DepositCurrency {
  id: string
  symbol: string
  name: string
  network: string
  minDeposit: number
  iconUrl?: string | null
}

interface DepositHistory {
  id: string
  amount: number
  currency: { symbol: string }
  address: string
  txHash?: string | null
  status: string
  createdAt: string
  confirmations: number
  requiredConfirmations: number
}

export default function DepositPage() {
  const [currencies, setCurrencies] = useState<DepositCurrency[]>([])
  const [selected, setSelected] = useState('')
  const [address, setAddress] = useState('')
  const [history, setHistory] = useState<DepositHistory[]>([])
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetch('/api/deposit/currencies')
      .then((r) => r.json())
      .then((d) => {
        setCurrencies(d.data || [])
        if ((d.data || []).length > 0) setSelected(d.data[0].id)
      })

    fetch('/api/deposit/history')
      .then((r) => r.json())
      .then((d) => setHistory(d.data || []))
  }, [])

  const generateAddress = async () => {
    if (!selected) return
    setGenerating(true)
    try {
      const res = await fetch('/api/deposit/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currencyId: selected }),
      })
      const data = await res.json()
      if (res.ok) {
        setAddress(data.data.address)
        toast.success('Deposit address generated!')
      } else {
        toast.error(data.error || 'Failed to generate address')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setGenerating(false)
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success('Address copied to clipboard!')
    }
  }

  const selectedCurrency = currencies.find((c) => c.id === selected)

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Deposit</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add funds to your account using cryptocurrency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deposit form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generate Deposit Address</CardTitle>
            <CardDescription>Select a currency to receive your deposit address.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Select Currency</Label>
              <Select value={selected} onValueChange={(v) => { setSelected(v); setAddress('') }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency..." />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.symbol} — {c.name} ({c.network})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCurrency && (
              <div className="rounded-lg bg-secondary/30 p-3 text-sm space-y-1.5">
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-medium">{selectedCurrency.network}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Min Deposit</span>
                  <span className="font-medium">
                    {selectedCurrency.minDeposit} {selectedCurrency.symbol}
                  </span>
                </p>
              </div>
            )}

            <Button
              onClick={generateAddress}
              variant="gradient"
              className="w-full gap-2"
              loading={generating}
              disabled={!selected}
            >
              <ArrowDownToLine className="h-4 w-4" />
              Generate Address
            </Button>

            {address && (
              <div className="space-y-3">
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Deposit Address</p>
                  <p className="font-mono text-sm break-all">{address}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 gap-2 h-7 text-xs"
                    onClick={copyAddress}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Address
                  </Button>
                </div>

                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-xs text-yellow-400">
                  ⚠️ Only send {selectedCurrency?.symbol} on the {selectedCurrency?.network} network.
                  Sending other tokens may result in permanent loss.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deposit Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>1. Select your preferred cryptocurrency above.</p>
            <p>2. Click &quot;Generate Address&quot; to get your personal deposit address.</p>
            <p>3. Send the exact amount to the generated address.</p>
            <p>4. Deposits are credited after required network confirmations (usually 3–6 confirmations).</p>
            <p>5. Once confirmed, funds will be added to your USD balance at current market rates.</p>
            <div className="mt-4 rounded-lg bg-secondary/30 p-3 space-y-2">
              <p className="font-medium text-foreground">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Always verify the network before sending</li>
                <li>Minimum deposits apply per currency</li>
                <li>Addresses are unique per user</li>
                <li>Processing time: 15 min – 2 hours</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deposit history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deposit History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No deposits yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left pb-3 font-medium">Date</th>
                    <th className="text-left pb-3 font-medium">Amount</th>
                    <th className="text-left pb-3 font-medium">Address</th>
                    <th className="text-left pb-3 font-medium">Confirmations</th>
                    <th className="text-left pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((dep) => (
                    <tr key={dep.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3">{formatDateTime(dep.createdAt)}</td>
                      <td className="py-3 font-medium">
                        {dep.amount} {dep.currency.symbol}
                      </td>
                      <td className="py-3 font-mono text-xs">{truncateAddress(dep.address)}</td>
                      <td className="py-3">
                        {dep.confirmations}/{dep.requiredConfirmations}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            dep.status === 'CONFIRMED' ? 'success' :
                            dep.status === 'FAILED' ? 'error' : 'warning'
                          }
                          className="text-xs"
                        >
                          {dep.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
