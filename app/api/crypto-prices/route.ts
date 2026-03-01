import { NextResponse } from 'next/server'

// Binance symbols → display symbol
const PAIRS: { binance: string; symbol: string }[] = [
  { binance: 'BTCUSDT',  symbol: 'BTC'   },
  { binance: 'ETHUSDT',  symbol: 'ETH'   },
  { binance: 'SOLUSDT',  symbol: 'SOL'   },
  { binance: 'BNBUSDT',  symbol: 'BNB'   },
  { binance: 'ADAUSDT',  symbol: 'ADA'   },
  { binance: 'DOTUSDT',  symbol: 'DOT'   },
  { binance: 'AVAXUSDT', symbol: 'AVAX'  },
  { binance: 'MATICUSDT',symbol: 'MATIC' },
  { binance: 'LINKUSDT', symbol: 'LINK'  },
  { binance: 'TRXUSDT',  symbol: 'TRX'   },
]

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  if (price >= 1)    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 4 })}`
}

export async function GET() {
  try {
    const symbolsParam = encodeURIComponent(JSON.stringify(PAIRS.map((p) => p.binance)))
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsParam}`

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 },
    })

    if (!res.ok) throw new Error(`Binance responded with ${res.status}`)

    const data: { symbol: string; lastPrice: string; priceChangePercent: string }[] = await res.json()

    const coins = PAIRS.map(({ binance, symbol }) => {
      const row = data.find((d) => d.symbol === binance)
      const price = parseFloat(row?.lastPrice ?? '0')
      const change = parseFloat(row?.priceChangePercent ?? '0')
      return {
        symbol,
        price: formatPrice(price),
        change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
        up: change >= 0,
      }
    })

    return NextResponse.json(coins, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=15' },
    })
  } catch (err) {
    console.error('[crypto-prices] fetch error:', err)
    return NextResponse.json(
      PAIRS.map(({ symbol }) => ({ symbol, price: '$—', change: '—', up: true })),
      { status: 200 }
    )
  }
}
