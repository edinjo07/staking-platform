import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Smartphone, Shield, Zap, Bell, BarChart3, TrendingUp, Download } from 'lucide-react'

export const metadata: Metadata = { title: 'Mobile App' }

const appFeatures = [
  { icon: <BarChart3 className="h-5 w-5" />, title: 'Live Analytics', desc: 'Track your earnings in real-time' },
  { icon: <Bell className="h-5 w-5" />, title: 'Push Notifications', desc: 'Get instant alerts on all activity' },
  { icon: <Shield className="h-5 w-5" />, title: 'Biometric Auth', desc: 'Face ID & fingerprint login' },
  { icon: <Zap className="h-5 w-5" />, title: 'Quick Staking', desc: 'Activate stakes in seconds' },
  { icon: <TrendingUp className="h-5 w-5" />, title: 'Portfolio View', desc: 'Complete overview of your assets' },
  { icon: <Smartphone className="h-5 w-5" />, title: 'Cross-platform', desc: 'iOS and Android available' },
]

export default function AppInfoPage() {
  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 mb-6">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">StakePlatform Mobile App</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Manage your staking portfolio anywhere, anytime. Our mobile app brings the full
            power of StakePlatform to your pocket.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button variant="gradient" size="lg" className="gap-2">
              <Download className="h-4 w-4" />
              Download for iOS
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <Download className="h-4 w-4" />
              Download for Android
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            *Mobile app coming soon. Stay tuned for updates!
          </p>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">App Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {appFeatures.map((feature) => (
              <div key={feature.title} className="glass-card p-5 flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
