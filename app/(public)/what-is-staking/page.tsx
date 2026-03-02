import { Metadata } from 'next'
import Link from 'next/link'
import {
  Coins,
  TrendingUp,
  Lock,
  Unlock,
  RefreshCw,
  ShieldCheck,
  Zap,
  HelpCircle,
  ArrowRight,
  Banknote,
  BarChart3,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'What is Staking? | StakePlatform',
  description:
    'Learn what crypto staking is, how it works, and how you can earn passive income — explained in simple, everyday language.',
}

const steps = [
  {
    icon: <Coins className="h-6 w-6" />,
    step: '1',
    title: 'You deposit crypto',
    description:
      'You put some of your cryptocurrency into a staking plan — like putting money in a savings account.',
  },
  {
    icon: <Lock className="h-6 w-6" />,
    step: '2',
    title: 'It gets locked for a period',
    description:
      'Your crypto stays locked for a set number of days. During this time it is working hard in the background.',
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    step: '3',
    title: 'You earn daily rewards',
    description:
      'Every 24 hours a percentage of your deposit is added to your balance as a reward — completely automatically.',
  },
  {
    icon: <Unlock className="h-6 w-6" />,
    step: '4',
    title: 'You get everything back + profit',
    description:
      'When the plan ends you get your original deposit back plus all the rewards you earned. You then withdraw or reinvest.',
  },
]

const analogies = [
  {
    icon: <Banknote className="h-7 w-7" />,
    title: 'Like a bank savings account',
    bad: 'A bank pays you 0.5% per year',
    good: 'Staking can pay you multiple percent per month',
    note: 'But unlike a bank, crypto markets carry risk — only stake what you can afford to hold.',
  },
  {
    icon: <RefreshCw className="h-7 w-7" />,
    title: 'Like renting out your car',
    bad: 'Your car just sits in the driveway losing value',
    good: 'You rent it out and it earns money while you sleep',
    note: 'Staking puts your idle crypto to work the same way.',
  },
  {
    icon: <BarChart3 className="h-7 w-7" />,
    title: 'Like a fixed-term deposit',
    bad: 'Lock money in a term deposit for a fixed rate',
    good: 'Lock crypto for a fixed period and earn a fixed daily rate',
    note: 'You know exactly what you will earn before you even start.',
  },
]

const faqs = [
  {
    q: 'Do I need to be a tech expert?',
    a: 'Not at all. You just deposit, choose a plan, and everything else is handled for you automatically.',
  },
  {
    q: 'Can I lose my money staking?',
    a: 'Crypto prices fluctuate. The number of coins you earn is fixed, but the dollar value of those coins can go up or down. Never stake money you cannot afford to keep long term.',
  },
  {
    q: 'How often do I get paid?',
    a: 'Rewards are credited to your account every 24 hours. You can watch your balance grow day by day.',
  },
  {
    q: 'Can I withdraw early?',
    a: 'Early withdrawal rules depend on the plan. Some plans allow it with a small fee, others require you to wait until the plan expires. Each plan clearly shows its terms.',
  },
  {
    q: 'What cryptocurrencies can I stake?',
    a: 'We support multiple major cryptocurrencies including Bitcoin, Ethereum, USDT, and more. Check the Staking Plans page for the full list.',
  },
  {
    q: 'Is there a minimum amount?',
    a: 'Yes, each plan has a minimum deposit — typically starting from $10 equivalent. You do not need a lot to get started.',
  },
]

const benefits = [
  { icon: <Zap className="h-5 w-5" />, title: 'Passive income', desc: 'Earn rewards 24/7 with zero effort after setup.' },
  { icon: <ShieldCheck className="h-5 w-5" />, title: 'No trading skills needed', desc: 'You do not need to watch charts or time the market.' },
  { icon: <Clock className="h-5 w-5" />, title: 'Predictable returns', desc: 'Fixed daily rates mean you know your earnings in advance.' },
  { icon: <RefreshCw className="h-5 w-5" />, title: 'Compound it', desc: 'Reinvest your rewards to earn rewards on your rewards.' },
]

export default function WhatIsStakingPage() {
  return (
    <div className="py-16">
      <div className="container mx-auto px-4">

        {/* ── Hero ── */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-400 mb-6">
            <HelpCircle className="h-3.5 w-3.5" />
            Beginner Friendly Guide
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-5">
            What is <span className="gradient-text">Crypto Staking</span>?
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            No jargon. No technical degree required. Here is everything you need to know about
            staking — explained as simply as possible.
          </p>
        </div>

        {/* ── One-liner definition ── */}
        <div className="glass-card p-8 md:p-10 mb-16 max-w-3xl mx-auto text-center rounded-2xl border border-primary/20">
          <p className="text-2xl md:text-3xl font-semibold leading-snug">
            Staking = <span className="gradient-text">putting your crypto to work</span> so it earns you money while you just wait.
          </p>
          <p className="text-muted-foreground mt-4">
            Think of it like a savings account — except instead of earning nearly nothing, you earn
            meaningful daily rewards.
          </p>
        </div>

        {/* ── How it works step by step ── */}
        <div className="mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">How does it actually work?</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
            Four simple steps. That is all there is to it.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.step} className="glass-card p-6 flex flex-col items-center text-center relative">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/30">
                  {s.step}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 mt-2">
                  {s.icon}
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Real-world analogies ── */}
        <div className="mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">Still confused? Think of it this way…</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
            Staking is not a new concept — you already understand it from everyday life.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {analogies.map((a) => (
              <div key={a.title} className="glass-card p-6 rounded-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  {a.icon}
                </div>
                <h3 className="font-semibold text-lg mb-3">{a.title}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-red-400 font-bold shrink-0">✗</span>
                    <span className="text-muted-foreground">{a.bad}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-green-400 font-bold shrink-0">✓</span>
                    <span className="text-foreground">{a.good}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic border-t border-white/5 pt-3">{a.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Benefits ── */}
        <div className="mb-20 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 p-8 md:p-10">
          <h2 className="text-2xl font-bold text-center mb-8">Why do people stake?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                  {b.icon}
                </div>
                <h3 className="font-semibold mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Visual example ── */}
        <div className="mb-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">A real example</h2>
          <div className="glass-card p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Silver Staking Plan — 30 days</p>
                <p className="text-sm text-muted-foreground">1% daily reward</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'You deposit', value: '$500', highlight: false },
                { label: 'Daily reward (1%)', value: '+$5.00 / day', highlight: false },
                { label: 'After 30 days earned', value: '$150.00', highlight: false },
                { label: 'Total payout', value: '$650.00', highlight: true },
              ].map((row) => (
                <div
                  key={row.label}
                  className={`flex justify-between items-center rounded-xl px-4 py-3 ${
                    row.highlight
                      ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20'
                      : 'bg-white/[0.03]'
                  }`}
                >
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className={`font-semibold ${row.highlight ? 'gradient-text text-base' : ''}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center italic">
              * Example for illustration only. Actual plans and rates may differ.
            </p>
          </div>
        </div>

        {/* ── FAQs ── */}
        <div className="mb-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Common questions answered</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="glass-card p-5 rounded-xl">
                <h3 className="font-semibold mb-2 flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5 shrink-0">Q.</span>
                  {faq.q}
                </h3>
                <p className="text-sm text-muted-foreground pl-5">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Ready to start earning?</h2>
          <p className="text-muted-foreground mb-7">
            Browse our plans and see exactly how much you could earn. No commitment needed — just explore.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/plans">
                View Staking Plans <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/signup">Create Free Account</Link>
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
