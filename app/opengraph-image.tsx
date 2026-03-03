import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'StakeOnix - Earn Passive Income'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Hexagon logo mark */}
        <svg
          viewBox="0 0 40 40"
          width="120"
          height="120"
          style={{ marginBottom: 32 }}
        >
          <defs>
            <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="50%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
          <polygon points="20,2 35,11 35,29 20,38 5,29 5,11" fill="url(#lg1)" />
          <rect x="12" y="10" width="13" height="5" rx="1.5" fill="white" />
          <rect x="12" y="10" width="5" height="10" rx="1.5" fill="white" />
          <rect x="12" y="17.5" width="16" height="5" rx="1.5" fill="white" />
          <rect x="23" y="20" width="5" height="10" rx="1.5" fill="white" />
          <rect x="15" y="25" width="13" height="5" rx="1.5" fill="white" />
        </svg>

        {/* Brand name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
            backgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '-2px',
            marginBottom: 16,
          }}
        >
          StakeOnix
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: '#94a3b8',
            letterSpacing: '0.05em',
          }}
        >
          Earn Passive Income · Grow Your Crypto
        </div>
      </div>
    ),
    { ...size },
  )
}
