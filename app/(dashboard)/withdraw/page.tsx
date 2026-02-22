'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatDateTime, truncateAddress } from '@/lib/utils'
import { ArrowUpFromLine, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface WithdrawalCurrency {
  id: string
  symbol: string
  name: string
  network: string
  minWithdrawal: number
  fee: number
}

interface WithdrawalHistory {
  id: string
  amount: number
  fee: number
  netAmount: number
  currency: { symbol: string }
  walletAddress: string
  status: string
  txHash?: string | null
  createdAt: string
}

interface SavedWallet {
  id: string
  label: string | null
  address: string
  network: string
  currency: string | null
}

export default function WithdrawPage() {
  const router = useRouter()
  const [currencies, setCurrencies] = useState<WithdrawalCurrency[]>([])
  const [selected, setSelected] = useState('')
  const [amount, setAmount] = useState('')
  const [wallet, setWallet] = useState('')
  const [pin, setPin] = useState('')
  const [balance, setBalance] = useState<number>(0)
  const [history, setHistory] = useState<WithdrawalHistory[]>([])
  const [savedWallets, setSavedWallets] = useState<SavedWallet[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/withdraw/currencies')
      .then((r) => r.json())
      .then((d) => {
        setCurrencies(d.data || [])
        if ((d.data || []).length > 0) setSelected(d.data[0].id)
      })

    fetch('/api/withdraw/balance')
      .then((r) => r.json())
      .then((d) => setBalance(d.data?.balance || 0))

    fetch('/api/withdraw/history')
      .then((r) => r.json())
      .then((d) => setHistory(d.data || []))

    fetch('/api/profile/wallets')
      .then((r) => r.json())
      .then((d) => setSavedWallets(d.data || []))
  }, [])

  const selectedCurrency = currencies.find((c) => c.id === selected)
  const numAmount = parseFloat(amount) || 0
  const estimatedFee = selectedCurrency ? selectedCurrency.fee : 0
  const youReceive = Math.max(0, numAmount - estimatedFee)

  const handleWithdraw = async () => {
    if (!selected || !amount || !wallet || !pin) {
      toast.error('Please fill in all fields.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/withdraw/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currencyId: selected, amount: numAmount, walletAddress: wallet, pin }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Withdrawal request submitted!')
        setAmount('')
        setWallet('')
        setPin('')
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to submit withdrawal.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Withdraw</h1>
        <p className="text-muted-foreground text-sm mt-1">Withdraw your funds to a crypto wallet.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Withdrawal Request</CardTitle>
            <CardDescription>
              Available balance:{' '}
              <span className="text-primary font-semibold">{formatCurrency(balance)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={selected} onValueChange={setSelected}>
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

            <div className="space-y-1.5">
              <Label>Amount (USD)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {selectedCurrency && (
                <p className="text-xs text-muted-foreground">
                  Min: {formatCurrency(selectedCurrency.minWithdrawal)}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Wallet Address</Label>
              {savedWallets.length > 0 && (
                <Select onValueChange={(id) => {
                  const w = savedWallets.find((s) => s.id === id)
                  if (w) setWallet(w.address)
                }}>
                  <SelectTrigger className="text-xs h-8 text-muted-foreground">
                    <SelectValue placeholder="Quick-fill from saved wallets..." />
                  </SelectTrigger>
                  <SelectContent>
                    {savedWallets.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.label ?? w.address} {w.currency ? `(${w.currency})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Input
                placeholder={`Enter ${selectedCurrency?.symbol || 'crypto'} wallet address`}
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Withdrawal PIN</Label>
              <Input
                type="password"
                placeholder="Enter your 4-digit PIN"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Set your PIN in Settings → Security
              </p>
            </div>

            {amount && selectedCurrency && (
              <div className="rounded-lg bg-secondary/30 p-3 text-sm space-y-1.5">
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span>{formatCurrency(numAmount)}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Network Fee</span>
                  <span className="text-yellow-400">-{formatCurrency(estimatedFee)}</span>
                </p>
                <div className="border-t border-border pt-1.5 flex justify-between font-medium">
                  <span>You Receive</span>
                  <span className="text-primary">{formatCurrency(youReceive)}</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleWithdraw}
              variant="gradient"
              className="w-full gap-2"
              loading={submitting}
              disabled={!selected || !amount || !wallet || !pin}
            >
              <ArrowUpFromLine className="h-4 w-4" />
              Submit Withdrawal
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Withdrawal Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-yellow-400">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Double-check your wallet address. Crypto transfers are irreversible.</p>
            </div>
            <p>1. Select the currency and enter the amount to withdraw.</p>
            <p>2. Enter your registered crypto wallet address.</p>
            <p>3. Confirm with your withdrawal PIN.</p>
            <p>4. Withdrawals are processed within 24 hours after admin review.</p>
            <div className="mt-4 rounded-lg bg-secondary/30 p-3 space-y-2">
              <p className="font-medium text-foreground">Notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Minimum withdrawal amounts apply</li>
                <li>Network fees are deducted from the amount</li>
                <li>PIN must be set in Security Settings</li>
                <li>Funds must be from confirmed deposits or earnings</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No withdrawals yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left pb-3 font-medium">Date</th>
                    <th className="text-left pb-3 font-medium">Amount</th>
                    <th className="text-left pb-3 font-medium">Fee</th>
                    <th className="text-left pb-3 font-medium">Net</th>
                    <th className="text-left pb-3 font-medium">Wallet</th>
                    <th className="text-left pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((w) => (
                    <tr key={w.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3">{formatDateTime(w.createdAt)}</td>
                      <td className="py-3">{formatCurrency(w.amount)}</td>
                      <td className="py-3 text-yellow-400">{formatCurrency(w.fee)}</td>
                      <td className="py-3 font-medium text-primary">{formatCurrency(w.netAmount)}</td>
                      <td className="py-3 font-mono text-xs">{truncateAddress(w.walletAddress)}</td>
                      <td className="py-3">
                        <Badge
                          variant={
                            w.status === 'COMPLETED' ? 'success' :
                            w.status === 'REJECTED' || w.status === 'FAILED' ? 'error' : 'warning'
                          }
                          className="text-xs"
                        >
                          {w.status}
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
