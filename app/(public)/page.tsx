import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlanCard } from '@/components/shared/PlanCard'
import { prisma } from '@/lib/db'
import { getAuthSession } from '@/lib/auth'
import {
  TrendingUp,
  Shield,
  Zap,
  Globe,
  Users,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronRight,
  Star,
  Award,
  Cpu,
  Activity,
  DollarSign,
  Rocket,
  Eye,
  RefreshCw,
  BadgeCheck,
  Wallet,
  BarChart2,
  Clock,
  ShieldCheck,
} from 'lucide-react'

const features = [
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: 'High Daily Returns',
    description: 'Earn competitive daily returns on your crypto assets with transparent, audited staking plans.',
    color: 'from-cyan-500/20 to-blue-500/20',
    iconColor: 'text-cyan-400',
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: 'Bank-Grade Security',
    description: 'Industry-leading security with 2FA, AES-256 encryption, PIN protection and cold wallet storage.',
    color: 'from-green-500/20 to-emerald-500/20',
    iconColor: 'text-green-400',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Instant Activation',
    description: 'Start earning immediately. Your stake activates instantly with no waiting period.',
    color: 'from-yellow-500/20 to-orange-500/20',
    iconColor: 'text-yellow-400',
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Multi-Currency Support',
    description: 'Deposit and earn in 170+ cryptocurrencies including BTC, ETH, USDT, BNB, SOL and more.',
    color: 'from-purple-500/20 to-violet-500/20',
    iconColor: 'text-purple-400',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Lucrative Referral Program',
    description: 'Earn 5% lifetime commissions on every stake your referrals make. Passive income on passive income.',
    color: 'from-pink-500/20 to-rose-500/20',
    iconColor: 'text-pink-400',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Real-Time Dashboard',
    description: 'Track your earnings live with detailed analytics, charts, transaction history and payout logs.',
    color: 'from-cyan-500/20 to-indigo-500/20',
    iconColor: 'text-indigo-400',
  },
]

const stats = [
  { value: '$2.5B+', label: 'Total Value Staked', icon: <DollarSign className="h-5 w-5" /> },
  { value: '480K+', label: 'Active Stakers', icon: <Users className="h-5 w-5" /> },
  { value: '170+', label: 'Assets Supported', icon: <Globe className="h-5 w-5" /> },
  { value: '99.98%', label: 'Uptime Guarantee', icon: <Activity className="h-5 w-5" /> },
]

const howItWorks = [
  {
    step: '01',
    title: 'Create Account',
    desc: 'Sign up in 2 minutes with email verification and complete your KYC to unlock all features.',
    icon: <BadgeCheck className="h-6 w-6" />,
  },
  {
    step: '02',
    title: 'Deposit Funds',
    desc: 'Add crypto using our multi-currency deposit system. Bitcoin, Ethereum, USDT, BNB and 170+ others.',
    icon: <Wallet className="h-6 w-6" />,
  },
  {
    step: '03',
    title: 'Choose a Plan',
    desc: 'Pick the staking plan that fits your goals. Flexible terms from 7 to 365 days with varying APRs.',
    icon: <BarChart2 className="h-6 w-6" />,
  },
  {
    step: '04',
    title: 'Earn Daily',
    desc: 'Watch your balance grow with automatic daily reward payouts deposited directly to your account.',
    icon: <TrendingUp className="h-6 w-6" />,
  },
]

const testimonials = [
  {
    name: 'Marcus Holloway',
    title: 'Professional Trader',
    avatar: 'MH',
    rating: 5,
    text: 'I have used multiple staking platforms and this one stands out for its transparency, consistent payouts, and exceptional support. My portfolio has grown 3x in 8 months.',
    amount: '+340%',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    name: 'Sarah Chen',
    title: 'Crypto Investor',
    avatar: 'SC',
    rating: 5,
    text: 'The daily returns are consistent and withdrawals are always instant. The security features give me complete peace of mind. Best staking platform I have ever used.',
    amount: '+218%',
    color: 'from-purple-500 to-violet-600',
  },
  {
    name: 'Ahmed Karimi',
    title: 'DeFi Enthusiast',
    avatar: 'AK',
    rating: 5,
    text: 'Started with just $500 and now earning passive income daily. The referral program is incredibly generous too. Highly recommended to anyone serious about crypto.',
    amount: '+192%',
    color: 'from-green-500 to-emerald-600',
  },
]

const cryptoCoins = [
  { symbol: 'btc', name: 'Bitcoin' },
  { symbol: 'eth', name: 'Ethereum' },
  { symbol: 'usdt', name: 'Tether' },
  { symbol: 'bnb', name: 'BNB' },
  { symbol: 'sol', name: 'Solana' },
  { symbol: 'usdc', name: 'USDC' },
  { symbol: 'ada', name: 'Cardano' },
  { symbol: 'trx', name: 'TRON' },
  { symbol: 'dot', name: 'Polkadot' },
  { symbol: 'avax', name: 'Avalanche' },
  { symbol: 'matic', name: 'Polygon' },
  { symbol: 'link', name: 'Chainlink' },
]

const tickerCoins = [
  { symbol: 'BTC', price: '$97,842', change: '+2.4%', up: true },
  { symbol: 'ETH', price: '$3,421', change: '+1.8%', up: true },
  { symbol: 'SOL', price: '$189.5', change: '+5.2%', up: true },
  { symbol: 'BNB', price: '$612.3', change: '-0.7%', up: false },
  { symbol: 'ADA', price: '$0.892', change: '+3.1%', up: true },
  { symbol: 'DOT', price: '$11.24', change: '+2.0%', up: true },
  { symbol: 'AVAX', price: '$42.80', change: '-1.2%', up: false },
  { symbol: 'MATIC', price: '$1.23', change: '+4.5%', up: true },
  { symbol: 'LINK', price: '$18.97', change: '+1.9%', up: true },
  { symbol: 'TRX', price: '$0.137', change: '+0.8%', up: true },
]

async function getActivePlans() {
  try {
    return await prisma.stakingPlan.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
      take: 6,
    })
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [plans, session] = await Promise.all([getActivePlans(), getAuthSession()])

  const topApr = plans.length > 0
    ? Math.max(...plans.map((p) => parseFloat((p.dailyRoi * 365).toFixed(2))))
    : 0

  return (
    <div className="relative overflow-hidden">

      {/* Live Crypto Ticker */}
      <div className="border-b border-white/5 bg-black/30 overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap py-2.5">
          {[...tickerCoins, ...tickerCoins].map((coin, i) => (
            <div key={i} className="inline-flex items-center gap-2 px-6 border-r border-white/5">
              <span className="text-xs font-bold text-white/70">{coin.symbol}</span>
              <span className="text-xs font-semibold text-white">{coin.price}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${coin.up ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {coin.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 hero-grid opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-blue-950/30" />
        <div className="glow-blob w-[600px] h-[600px] bg-cyan-500/15 top-[-100px] left-[-100px]" />
        <div className="glow-blob w-[500px] h-[500px] bg-blue-600/10 bottom-0 right-[-50px]" />
        <div className="glow-blob w-[300px] h-[300px] bg-purple-600/10 top-1/2 left-1/2" />

        <div className="container relative mx-auto px-4 py-20 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-6 items-center">

            {/* Left: Text content */}
            <div className="text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-300 mb-6 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                </span>
                Live &middot; Earn up to {topApr > 0 ? `${topApr}% APR` : '365% APR'} &mdash; Join 480K+ stakers
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
                Fast, Secure &amp;<br />
                <span className="gradient-text">Effortless Crypto</span><br />
                <span className="text-white">Staking for All</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
                Choose a plan, deposit crypto, and earn automatic daily rewards. No lockups,
                no complexity &mdash; just steady{' '}
                <strong className="text-white font-semibold">passive income</strong> from your digital assets.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link href={session ? '/dashboard' : '/signup'}>
                  <Button
                    size="xl"
                    className="gap-2 font-bold text-base px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-2xl shadow-cyan-500/30 border-0 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/50"
                  >
                    <Rocket className="h-5 w-5" />
                    {session ? 'Go to Dashboard' : 'Start Earning Now'}
                  </Button>
                </Link>
                <Link href="/plans">
                  <Button
                    variant="outline"
                    size="xl"
                    className="gap-2 font-semibold text-base px-8 py-4 border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 rounded-2xl transition-all duration-300"
                  >
                    <Eye className="h-5 w-5" />
                    View Plans
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-3">
                {[
                  { icon: <ShieldCheck className="h-4 w-4 text-green-400" />, label: 'SSL Secured' },
                  { icon: <BadgeCheck className="h-4 w-4 text-blue-400" />, label: 'KYC Compliant' },
                  { icon: <Lock className="h-4 w-4 text-yellow-400" />, label: '2FA Protected' },
                  { icon: <RefreshCw className="h-4 w-4 text-cyan-400" />, label: 'Instant Payouts' },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white/5 border border-white/[0.08] rounded-full px-3 py-1.5">
                    {b.icon}
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hero Visual */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-[380px] h-[380px] md:w-[480px] md:h-[480px]">
                <div className="absolute inset-0 rounded-full border border-cyan-500/15 animate-spin-slow" />
                <div className="absolute inset-8 rounded-full border border-blue-500/10 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />
                <div className="absolute inset-16 rounded-full border border-purple-500/10" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-float-slow">
                    <svg width="260" height="260" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00c4e8" stopOpacity="0.95"/>
                          <stop offset="100%" stopColor="#4db8ff" stopOpacity="0.8"/>
                        </linearGradient>
                        <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.85"/>
                          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.7"/>
                        </linearGradient>
                        <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.75"/>
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.55"/>
                        </linearGradient>
                        <linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4338ca" stopOpacity="0.65"/>
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.45"/>
                        </linearGradient>
                        <filter id="fg">
                          <feGaussianBlur stdDeviation="3" result="cb"/>
                          <feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                      </defs>
                      <ellipse cx="140" cy="248" rx="95" ry="12" fill="#000" opacity="0.3"/>
                      <path d="M35 218 L140 200 L245 218 L140 236 Z" fill="url(#g4)" filter="url(#fg)"/>
                      <ellipse cx="140" cy="200" rx="105" ry="18" fill="url(#g4)" opacity="0.5"/>
                      <path d="M58 185 L140 168 L222 185 L140 202 Z" fill="url(#g3)" filter="url(#fg)"/>
                      <ellipse cx="140" cy="168" rx="82" ry="15" fill="url(#g3)" opacity="0.6"/>
                      <path d="M80 153 L140 137 L200 153 L140 169 Z" fill="url(#g2)" filter="url(#fg)"/>
                      <ellipse cx="140" cy="137" rx="60" ry="12" fill="url(#g2)" opacity="0.7"/>
                      <path d="M103 121 L140 106 L177 121 L140 136 Z" fill="url(#g1)" filter="url(#fg)"/>
                      <ellipse cx="140" cy="106" rx="37" ry="9" fill="url(#g1)" opacity="0.9"/>
                      <polygon points="140,62 117,106 163,106" fill="url(#g1)" filter="url(#fg)" opacity="0.95"/>
                      <ellipse cx="140" cy="62" rx="7" ry="7" fill="#fff" opacity="0.95" filter="url(#fg)"/>
                      <line x1="35" y1="218" x2="58" y2="185" stroke="#00c4e8" strokeOpacity="0.25" strokeWidth="0.8"/>
                      <line x1="245" y1="218" x2="222" y2="185" stroke="#00c4e8" strokeOpacity="0.25" strokeWidth="0.8"/>
                      <line x1="58" y1="185" x2="80" y2="153" stroke="#4db8ff" strokeOpacity="0.2" strokeWidth="0.8"/>
                      <line x1="222" y1="185" x2="200" y2="153" stroke="#4db8ff" strokeOpacity="0.2" strokeWidth="0.8"/>
                      <circle cx="35" cy="218" r="2.5" fill="#7c3aed" opacity="0.8"/>
                      <circle cx="245" cy="218" r="2.5" fill="#7c3aed" opacity="0.8"/>
                      <circle cx="58" cy="185" r="2" fill="#4f46e5" opacity="0.8"/>
                      <circle cx="222" cy="185" r="2" fill="#4f46e5" opacity="0.8"/>
                      <circle cx="80" cy="153" r="2" fill="#2563eb" opacity="0.9"/>
                      <circle cx="200" cy="153" r="2" fill="#2563eb" opacity="0.9"/>
                      <circle cx="103" cy="121" r="2" fill="#00c4e8" opacity="0.9"/>
                      <circle cx="177" cy="121" r="2" fill="#00c4e8" opacity="0.9"/>
                    </svg>
                  </div>
                </div>

                {/* Orbiting coin badges */}
                {[
                  { symbol: 'btc', angle: 0, delay: '0s', bg: 'bg-orange-500/80' },
                  { symbol: 'eth', angle: 90, delay: '-3s', bg: 'bg-blue-500/80' },
                  { symbol: 'sol', angle: 180, delay: '-6s', bg: 'bg-purple-500/80' },
                  { symbol: 'usdt', angle: 270, delay: '-9s', bg: 'bg-green-600/80' },
                ].map((coin) => (
                  <div
                    key={coin.symbol}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ transform: `rotate(${coin.angle}deg)` }}
                  >
                    <div className="animate-orbit" style={{ animationDelay: coin.delay }}>
                      <div
                        className={`w-11 h-11 rounded-2xl ${coin.bg} flex items-center justify-center shadow-xl border border-white/20 backdrop-blur-sm`}
                        style={{ transform: `rotate(-${coin.angle}deg)` }}
                      >
                        <img
                          src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${coin.symbol}.svg`}
                          alt={coin.symbol.toUpperCase()}
                          className="w-6 h-6"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Floating stat cards */}
                <div className="absolute -top-6 right-0 glass-card px-4 py-3 animate-float shadow-2xl border border-cyan-500/20 z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Daily Reward</p>
                      <p className="text-sm font-bold text-green-400">+$248.50</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 left-0 glass-card px-4 py-3 animate-float shadow-2xl border border-purple-500/20 z-10" style={{ animationDelay: '-3s' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Active Stakers</p>
                      <p className="text-sm font-bold gradient-text">480,291</p>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 -right-20 -translate-y-1/2 glass-card px-4 py-3 animate-float-sm shadow-2xl border border-yellow-500/20 z-10" style={{ animationDelay: '-1.5s' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                      <Award className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Max APR</p>
                      <p className="text-sm font-bold text-yellow-400">{topApr > 0 ? `${topApr}%` : '365%'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="py-14 relative border-y border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-600/5 to-purple-500/5" />
        <div className="container relative mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {stats.map((stat, i) => (
              <div key={stat.label} className="text-center group relative">
                {i < stats.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-10 bg-white/5" />
                )}
                <div className="flex justify-center mb-2 text-cyan-400/50 group-hover:text-cyan-400 transition-colors">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-black gradient-text mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUPPORTED CRYPTOCURRENCIES */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-2">170+ Assets</p>
            <h2 className="text-3xl md:text-4xl font-bold">Supported Cryptocurrencies</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Stake and earn rewards across the world's most popular digital assets.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-center justify-center max-w-4xl mx-auto">
            {cryptoCoins.map((coin) => (
              <div
                key={coin.symbol}
                className="group flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300 hover:scale-110 cursor-default w-20"
                title={coin.name}
              >
                <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center p-2 group-hover:border-cyan-500/30 transition-colors">
                  <img
                    src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${coin.symbol}.svg`}
                    alt={coin.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{coin.symbol.toUpperCase()}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/[0.03] border border-dashed border-white/10 w-20 cursor-default">
              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center">
                <span className="text-base text-muted-foreground font-bold">+158</span>
              </div>
              <span className="text-[10px] text-muted-foreground text-center">More</span>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR PLANS */}
      {plans.length > 0 && (
        <section className="py-20 relative border-t border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/15 to-transparent pointer-events-none" />
          <div className="container relative mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-2">Staking Products</p>
                <h2 className="text-3xl md:text-4xl font-bold">Popular Plans</h2>
                <p className="text-muted-foreground mt-2 max-w-lg">
                  Our most popular staking options delivering the best risk-adjusted returns.
                </p>
              </div>
              <Link href="/plans" className="hidden md:flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                View all plans <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} isLoggedIn={!!session} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/plans">
                <Button variant="outline" size="lg" className="gap-2 border-white/10 hover:border-cyan-500/40 rounded-xl">
                  View All Plans <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="py-20 relative border-t border-white/5">
        <div className="absolute inset-0 hero-grid opacity-10" />
        <div className="container relative mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-2">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Start Earning in 4 Steps</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              No crypto expertise required. Go from zero to earning in under 5 minutes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            <div className="hidden lg:block absolute top-11 left-[calc(12.5%+28px)] right-[calc(12.5%+28px)] h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            {howItWorks.map((item, i) => (
              <div key={item.step} className="relative group">
                <div className="glass-card p-7 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-500 h-full">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 text-cyan-400 group-hover:from-cyan-500/30 group-hover:to-blue-600/30 transition-all">
                      {item.icon}
                    </div>
                    <span className="text-4xl font-black text-white/5 group-hover:text-white/10 transition-colors">{item.step}</span>
                  </div>
                  <h3 className="font-bold text-base mb-2 text-white">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:flex absolute top-11 -right-3 z-10 items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30">
                    <ChevronRight className="h-3 w-3 text-cyan-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 relative">
        <div className="glow-blob w-[900px] h-[400px] bg-cyan-500/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="container relative mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-2">Platform Benefits</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Built for Serious Earners</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to grow your crypto portfolio safely, efficiently and profitably.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div key={feature.title} className="glass-card p-7 hover:border-white/20 hover:bg-white/5 transition-all duration-300 group cursor-default">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} ${feature.iconColor} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURITY SECTION */}
      <section className="py-16 border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 to-purple-950/20" />
        <div className="glow-blob w-[400px] h-[400px] bg-blue-600/10 bottom-0 right-0" />
        <div className="container relative mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-3">Enterprise Security</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Funds Are Always Safe</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed max-w-lg">
                We employ the same security standards used by the world's top financial institutions.
                Your assets are protected 24/7 with real-time threat monitoring and instant response.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: <Shield className="h-5 w-5 text-green-400" />, title: 'AES-256 Encryption', desc: 'Military-grade data protection' },
                  { icon: <Lock className="h-5 w-5 text-blue-400" />, title: 'Cold Wallet Storage', desc: '95% of funds in cold storage' },
                  { icon: <Eye className="h-5 w-5 text-cyan-400" />, title: 'Real-time Monitoring', desc: '24/7 anomaly detection' },
                  { icon: <RefreshCw className="h-5 w-5 text-purple-400" />, title: 'Multi-sig Auth', desc: 'Multi-signature withdrawals' },
                  { icon: <BadgeCheck className="h-5 w-5 text-yellow-400" />, title: 'KYC/AML Compliance', desc: 'Fully regulated operations' },
                  { icon: <Cpu className="h-5 w-5 text-pink-400" />, title: 'DDoS Protection', desc: 'Cloudflare enterprise shield' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all">
                    <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="relative w-72 h-72 md:w-80 md:h-80">
                <div className="absolute inset-0 rounded-full border-2 border-green-500/20 animate-pulse-glow" />
                <div className="absolute inset-10 rounded-full border border-cyan-500/15" />
                <div className="absolute inset-20 rounded-full border border-blue-500/15 animate-spin-slow" style={{ animationDuration: '15s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-green-500/20 to-cyan-600/20 border border-green-500/30 flex items-center justify-center animate-pulse-glow">
                    <ShieldCheck className="h-14 w-14 text-green-400" />
                  </div>
                </div>
                {[
                  { icon: <Lock className="h-3.5 w-3.5 text-blue-400" />, bg: 'bg-blue-500/20', top: '0', left: '50%', tx: '-50%', ty: '-50%' },
                  { icon: <Zap className="h-3.5 w-3.5 text-yellow-400" />, bg: 'bg-yellow-500/20', top: '50%', left: '100%', tx: '-100%', ty: '-50%' },
                  { icon: <Eye className="h-3.5 w-3.5 text-cyan-400" />, bg: 'bg-cyan-500/20', top: '100%', left: '50%', tx: '-50%', ty: '-100%' },
                  { icon: <BadgeCheck className="h-3.5 w-3.5 text-purple-400" />, bg: 'bg-purple-500/20', top: '50%', left: '0', tx: '0%', ty: '-50%' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`absolute w-9 h-9 rounded-xl ${item.bg} border border-white/10 flex items-center justify-center`}
                    style={{ top: item.top, left: item.left, transform: `translate(${item.tx}, ${item.ty})` }}
                  >
                    {item.icon}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-2">Community</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Trusted by Thousands</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Real stories from real investors growing their wealth every single day.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="glass-card p-7 hover:border-white/20 transition-all duration-300 hover:bg-white/5 flex flex-col">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">"{t.text}"</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-xs font-bold text-white`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Return</p>
                    <p className="text-sm font-bold text-green-400">{t.amount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 relative">
        <div className="glow-blob w-[700px] h-[350px] bg-cyan-500/[0.08] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="container relative mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/80 via-blue-950/60 to-purple-950/40 border border-cyan-500/20 rounded-3xl" />
            <div className="absolute inset-0 hero-grid opacity-20 rounded-3xl" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-72 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <div className="relative p-12 md:p-20 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-300 mb-6">
                <Rocket className="h-3.5 w-3.5" />
                Start earning in under 5 minutes
              </div>
              <h2 className="text-4xl md:text-6xl font-black mb-5 leading-tight">
                Ready to Start{' '}
                <span className="gradient-text">Staking?</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-lg leading-relaxed">
                Create your free account today and earn your first daily reward within minutes.
                No minimum lockup. Withdraw anytime. Join 480,000+ smart investors.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={session ? '/dashboard' : '/signup'}>
                  <Button
                    size="xl"
                    className="gap-2 font-bold text-base px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-2xl shadow-cyan-500/30 border-0 rounded-2xl transition-all duration-300 hover:scale-105"
                  >
                    <Rocket className="h-5 w-5" />
                    {session ? 'View Dashboard' : 'Create Free Account'}
                  </Button>
                </Link>
                <Link href="/plans">
                  <Button
                    variant="outline"
                    size="xl"
                    className="gap-2 font-semibold text-base px-10 py-5 border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 rounded-2xl transition-all duration-300"
                  >
                    Explore Plans <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-muted-foreground">
                {[
                  'No hidden fees',
                  'Withdraw anytime',
                  'Instant activation',
                  '$100 welcome bonus',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
