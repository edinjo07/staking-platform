'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'What is StakePlatform?',
        a: 'StakePlatform is a cryptocurrency staking platform that allows you to earn passive income by staking your digital assets. We pool staking resources and distribute rewards to our users daily.',
      },
      {
        q: 'How do I start staking?',
        a: 'Simply create a free account, deposit funds in your preferred cryptocurrency, choose a staking plan that fits your goals, and activate your stake. You will start earning daily rewards immediately.',
      },
      {
        q: 'Is there a minimum deposit?',
        a: 'Minimum deposit amounts vary by cryptocurrency and staking plan. You can find specific minimums on each plan\'s details page. Generally, minimums start from $10 USD equivalent.',
      },
    ],
  },
  {
    category: 'Staking & Earnings',
    items: [
      {
        q: 'How are staking rewards calculated?',
        a: 'Rewards are calculated based on your staked amount multiplied by the daily ROI percentage of your chosen plan. Rewards are credited to your account every 24 hours.',
      },
      {
        q: 'Can I have multiple active stakes?',
        a: 'Yes! You can have multiple active stakes with different plans simultaneously. This allows you to diversify your staking strategy.',
      },
      {
        q: 'What happens when my stake completes?',
        a: 'When your stake reaches its end date, your principal amount plus all earned rewards are automatically credited to your account balance. You can then withdraw or reinvest.',
      },
    ],
  },
  {
    category: 'Deposits & Withdrawals',
    items: [
      {
        q: 'How do I deposit funds?',
        a: 'Navigate to the Deposit page, select your cryptocurrency, and you will receive a unique deposit address. Send funds to that address and they will be credited after network confirmations.',
      },
      {
        q: 'How long do withdrawals take?',
        a: 'Withdrawal requests are typically processed within 24 hours. Processing time may vary depending on network congestion and our security review process.',
      },
      {
        q: 'Are there withdrawal fees?',
        a: 'Yes, small network fees apply to cover blockchain transaction costs. The exact fee is shown before you confirm any withdrawal.',
      },
    ],
  },
  {
    category: 'Security',
    items: [
      {
        q: 'How secure is StakePlatform?',
        a: 'We employ industry-leading security measures including SSL encryption, two-factor authentication (2FA), withdrawal PIN codes, and cold storage for the majority of user funds.',
      },
      {
        q: 'What is 2FA and should I enable it?',
        a: 'Two-Factor Authentication adds an extra layer of security by requiring a time-based code from your authenticator app in addition to your password. We strongly recommend enabling it.',
      },
    ],
  },
  {
    category: 'Referral Program',
    items: [
      {
        q: 'How does the referral program work?',
        a: 'Share your unique referral link with friends. When they create an account and activate a stake, you earn a commission based on the staking amount. Commissions are automatically credited to your account.',
      },
      {
        q: 'Is there a limit to referral earnings?',
        a: 'There is no limit! You can refer as many users as you like and earn commissions on all their stakes.',
      },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium hover:text-primary transition-colors"
        onClick={() => setOpen(!open)}
      >
        {q}
        <ChevronDown
          className={cn('h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="pb-4 text-sm text-muted-foreground leading-relaxed">{a}</div>
      )}
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">
            Find answers to the most common questions about StakePlatform.
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map((category) => (
            <div key={category.category}>
              <h2 className="text-lg font-semibold mb-3 text-primary">{category.category}</h2>
              <div className="glass-card px-6 divide-y divide-border">
                {category.items.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center glass-card p-8">
          <h3 className="font-semibold text-lg mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-4">
            Our support team is available 24/7 to help you.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
