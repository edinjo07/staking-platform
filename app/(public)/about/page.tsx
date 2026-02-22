import { Metadata } from 'next'
import { Shield, Target, Users, TrendingUp } from 'lucide-react'

export const metadata: Metadata = { title: 'About Us' }

const team = [
  { name: 'Alex Johnson', role: 'CEO & Founder', avatar: '👤' },
  { name: 'Sarah Williams', role: 'CTO', avatar: '👤' },
  { name: 'Michael Chen', role: 'Head of Security', avatar: '👤' },
  { name: 'Emma Davis', role: 'Head of Finance', avatar: '👤' },
]

const values = [
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Security First',
    description: 'We implement bank-grade security to protect your assets at all times.',
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: 'Transparency',
    description: 'All our staking returns and operations are fully transparent and verifiable.',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Community',
    description: 'We put our users first, building a thriving community of investors.',
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: 'Innovation',
    description: 'Continuously improving our platform with the latest DeFi technologies.',
  },
]

export default function AboutPage() {
  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About StakePlatform</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We are a team of passionate crypto experts dedicated to making staking accessible,
            profitable, and secure for everyone.
          </p>
        </div>

        {/* Mission */}
        <div className="glass-card p-8 md:p-12 mb-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 gradient-text">Our Mission</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Founded in 2020, StakePlatform was created with a single mission: to democratize
            access to DeFi staking rewards. We believe that everyone should have the opportunity
            to grow their wealth through crypto staking, regardless of their technical background
            or the size of their portfolio.
          </p>
          <p className="text-muted-foreground text-lg leading-relaxed mt-4">
            Today, we serve over 15,000 investors across the globe with a platform that combines
            simplicity, security, and competitive returns. Our automated staking system ensures
            you earn rewards 24/7 without any manual intervention.
          </p>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div key={value.title} className="glass-card p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-4">
                  {value.icon}
                </div>
                <h3 className="font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Platform Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '$50M+', label: 'Assets Staked' },
              { value: '15,000+', label: 'Active Users' },
              { value: '3+', label: 'Years Operating' },
              { value: '100%', label: 'Payout Rate' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
