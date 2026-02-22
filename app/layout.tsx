import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'StakePlatform - Earn Passive Income',
    template: '%s | StakePlatform',
  },
  description:
    'A professional staking platform to grow your crypto assets with high daily returns.',
  keywords: ['staking', 'crypto', 'bitcoin', 'ethereum', 'passive income', 'DeFi'],
  authors: [{ name: 'StakePlatform' }],
  creator: 'StakePlatform',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'StakePlatform - Earn Passive Income',
    description: 'A professional staking platform to grow your crypto assets.',
    siteName: 'StakePlatform',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            theme="dark"
            richColors
            closeButton
          />
        </Providers>
      </body>
    </html>
  )
}
