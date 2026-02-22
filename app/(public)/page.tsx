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
} from 'lucide-react'

const features = [
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: 'High Daily Returns',
    description: 'Earn competitive daily returns on your crypto assets with transparent staking plans.',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Secure & Trusted',
    description: 'Industry-leading security with 2FA, PIN protection, and cold wallet storage.',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Instant Activation',
    description: 'Start earning immediately. No waiting period â€” your stake activates right away.',
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Multi-Currency',
    description: 'Deposit and withdraw in multiple cryptocurrencies including BTC, ETH, USDT.',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Referral Program',
    description: 'Earn commissions by referring friends. Get paid when they start staking.',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Live Dashboard',
    description: 'Track your earnings in real-time with detailed analytics and history.',
  },
]

const stats = [
  { value: '$50M+', label: 'Total Staked' },
  { value: '15,000+', label: 'Active Users' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
]

const howItWorks = [
  { step: '01', title: 'Create Account', desc: 'Sign up in minutes with email verification.' },
  { step: '02', title: 'Deposit Funds', desc: 'Add crypto using our multi-currency deposit system.' },
  { step: '03', title: 'Choose a Plan', desc: 'Pick the staking plan that fits your goals and risk appetite.' },
  { step: '04', title: 'Earn Daily', desc: 'Watch your balance grow with automatic daily reward payouts.' },
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
    <div className="relative">

      {/* â”€â”€ APR ticker row â”€â”€ */}
      {plans.length > 0 && (
        <div className="border-b border-border bg-secondary/20 overflow-x-auto">
          <div className="flex gap-0 divide-x divide-border" style={{ minWidth: 'max-content' }}>
            {plans.slice(0, 6).map((plan) => {
              const apr = (plan.dailyRoi * 365).toFixed(2)
              return (
                <Link
                  key={plan.id}
                  href="/plans"
                  className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/60 transition-colors group flex-shrink-0"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary ring-1 ring-border group-hover:ring-primary/30 transition-all flex-shrink-0">
                    {plan.iconUrl ? (
                      <img src={plan.iconUrl} alt={plan.name} className="h-5 w-5 rounded-full" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight">{plan.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {plan.durationDays <= 30 ? 'Flexible' : 'Fixed'}
                    </p>
                  </div>
                  <div className="ml-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">APR</p>
                    <p className="text-sm font-bold gradient-text">{apr}%</p>
                  </div>
                </Link>
              )
            })}
            <Link href="/plans" className="flex items-center gap-1 px-4 py-3 text-xs text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* â”€â”€ Hero Section â”€â”€ */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 animated-bg opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="container relative mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
            <Zap className="h-3.5 w-3.5" />
            Earn up to {topApr > 0 ? `${topApr}% APR` : 'high returns'} â€” Trusted by 15,000+ investors
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Stake Your Crypto. <br />
            <span className="gradient-text">Earn Every Day.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8">
            Choose a plan, deposit crypto, and earn automatic daily rewards. No lockups,
            no complexity â€” just steady passive income from your digital assets.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link href={session ? '/dashboard' : '/signup'}>
              <Button variant="gradient" size="xl" className="gap-2 font-semibold">
                {session ? 'Go to Dashboard' : 'Start Earning Now'}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/plans">
              <Button variant="outline" size="xl" className="gap-2">
                View All Plans <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-5">
            {['SSL Secured', 'KYC Compliant', 'Regulated', '2FA Protected'].map((badge) => (
              <div key={badge} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ Stats bar â”€â”€ */}
      <section className="py-10 border-y border-border bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ Popular Plans â”€â”€ */}
      {plans.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Staking Products</p>
                <h2 className="text-3xl md:text-4xl font-bold">Popular Plans</h2>
                <p className="text-muted-foreground mt-2 max-w-lg">
                  Our most popular staking options offering the best risk-adjusted returns.
                </p>
              </div>
              <Link href="/plans" className="hidden md:flex items-center gap-1 text-sm text-primary hover:underline">
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
                <Button variant="outline" size="lg" className="gap-2">
                  View All Plans <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* â”€â”€ How It Works â”€â”€ */}
      <section className="py-20 border-t border-border bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Start earning in 4 easy steps. No crypto experience required.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <div key={item.step} className="relative glass-card p-6 hover:border-primary/30 transition-colors">
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 z-10 -translate-y-1/2">
                    <ChevronRight className="h-5 w-5 text-primary/40" />
                  </div>
                )}
                <div className="text-4xl font-black gradient-text opacity-30 mb-3">{item.step}</div>
                <h3 className="font-bold text-base mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ Features â”€â”€ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Why StakePlatform</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Built for Serious Earners</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to grow your crypto portfolio safely and efficiently.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div key={feature.title} className="glass-card p-6 hover:border-primary/20 hover:bg-white/5 transition-all duration-300 group">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ Security trust band â”€â”€ */}
      <section className="py-10 border-y border-border bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-muted-foreground">
            {[
              { icon: <Shield className="h-5 w-5 text-green-500" />, label: 'SSL Encrypted' },
              { icon: <Lock className="h-5 w-5 text-blue-400" />, label: 'Cold Wallet Storage' },
              { icon: <Zap className="h-5 w-5 text-yellow-400" />, label: 'Instant Payouts' },
              { icon: <Users className="h-5 w-5 text-primary" />, label: '24/7 Live Support' },
              { icon: <CheckCircle2 className="h-5 w-5 text-green-500" />, label: 'KYC Compliant' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ CTA â”€â”€ */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden border border-primary/20 p-10 md:p-16 text-center glow-green">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-48 bg-gradient-to-r from-transparent via-primary to-transparent" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Get Started Today</p>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Ready to Start <span className="gradient-text">Staking?</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                Create your free account and earn your first daily reward within minutes.
                No minimum lockup. Withdraw anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={session ? '/dashboard' : '/signup'}>
                  <Button variant="gradient" size="xl" className="gap-2 font-semibold">
                    {session ? 'View Dashboard' : 'Create Free Account'}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/plans">
                  <Button variant="outline" size="xl">
                    Explore Plans
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
