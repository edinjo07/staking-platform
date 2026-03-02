import { NextResponse } from 'next/server'

// CoinGecko id → display symbol
const COINS: { id: string; symbol: string }[] = [
  { id: 'bitcoin',       symbol: 'BTC'   },
  { id: 'ethereum',      symbol: 'ETH'   },
  { id: 'solana',        symbol: 'SOL'   },
  { id: 'binancecoin',   symbol: 'BNB'   },
  { id: 'cardano',       symbol: 'ADA'   },
  { id: 'polkadot',      symbol: 'DOT'   },
  { id: 'avalanche-2',   symbol: 'AVAX'  },
  { id: 'matic-network', symbol: 'MATIC' },
  { id: 'chainlink',     symbol: 'LINK'  },
  { id: 'tron',          symbol: 'TRX'   },
]

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  if (price >= 1)    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 4 })}`
}

type CoinGeckoResponse = Record<string, { usd: number; usd_24h_change: number }>

export async function GET() {
  try {
    const ids = COINS.map((c) => c.id).join(',')
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    })

    if (!res.ok) throw new Error(`CoinGecko responded with ${res.status}`)

    const data: CoinGeckoResponse = await res.json()

    const coins = COINS.map(({ id, symbol }) => {
      const row = data[id]
      const price = row?.usd ?? 0
      const change = row?.usd_24h_change ?? 0
      return {
        symbol,
        price: formatPrice(price),
        change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
        up: change >= 0,
      }
    })

    return NextResponse.json(coins, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' },
    })
  } catch (err) {
    console.error('[crypto-prices] fetch error:', err)
    return NextResponse.json(
      COINS.map(({ symbol }) => ({ symbol, price: '$—', change: '—', up: true })),
      { status: 200 }
    )
  }
}
