'use client'

import { useEffect, useState, useCallback } from 'react'

interface TickerCoin {
  symbol: string
  price: string
  change: string
  up: boolean
}

const FALLBACK: TickerCoin[] = [
  { symbol: 'BTC', price: '...', change: '...', up: true },
  { symbol: 'ETH', price: '...', change: '...', up: true },
  { symbol: 'SOL', price: '...', change: '...', up: true },
  { symbol: 'BNB', price: '...', change: '...', up: true },
  { symbol: 'ADA', price: '...', change: '...', up: true },
  { symbol: 'DOT', price: '...', change: '...', up: true },
  { symbol: 'AVAX', price: '...', change: '...', up: true },
  { symbol: 'MATIC', price: '...', change: '...', up: true },
  { symbol: 'LINK', price: '...', change: '...', up: true },
  { symbol: 'TRX', price: '...', change: '...', up: true },
]

export default function CryptoTicker() {
  const [coins, setCoins] = useState<TickerCoin[]>(FALLBACK)

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/crypto-prices', { cache: 'no-store' })
      if (!res.ok) return
      const data: TickerCoin[] = await res.json()
      if (Array.isArray(data) && data.length > 0) setCoins(data)
    } catch {
      // silently keep last known prices
    }
  }, [])

  useEffect(() => {
    fetchPrices()
    const id = setInterval(fetchPrices, 60_000) // refresh every 60 s
    return () => clearInterval(id)
  }, [fetchPrices])

  const displayed = [...coins, ...coins] // duplicate for seamless loop

  return (
    <div className="border-b border-white/5 bg-black/30 overflow-hidden">
      <div className="flex animate-ticker whitespace-nowrap py-2.5">
        {displayed.map((coin, i) => (
          <div key={i} className="inline-flex items-center gap-2 px-6 border-r border-white/5">
            <span className="text-xs font-bold text-white/70">{coin.symbol}</span>
            <span className="text-xs font-semibold text-white">{coin.price}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                coin.up ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {coin.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
