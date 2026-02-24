import Link from 'next/link'
import { LayoutGrid, Twitter, Github, Mail, Shield, TrendingUp, Globe, Zap } from 'lucide-react'

const footerLinks = {
  Platform: [
    { href: '/plans', label: 'Staking Plans' },
    { href: '/about', label: 'About Us' },
    { href: '/app-info', label: 'Mobile App' },
    { href: '/faq', label: 'FAQ' },
  ],
  Legal: [
    { href: '/terms', label: 'Terms of Service' },
    { href: '/policy', label: 'Privacy Policy' },
  ],
  Support: [
    { href: '/contact', label: 'Contact Us' },
    { href: '/faq', label: 'Help Center' },
  ],
}

const trustBadges = [
  { label: 'SSL Secured' },
  { label: 'Instant Payouts' },
  { label: '$2.5B+ Managed' },
  { label: '170+ Countries' },
]

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background relative overflow-hidden">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-96 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      {/* Trust badges strip */}
      <div className="border-b border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-green-400" />
              <span className="font-medium">SSL Secured</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="font-medium">Instant Payouts</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <span className="font-medium">$2.5B+ Managed</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4 text-blue-400" />
              <span className="font-medium">170+ Countries</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-xl mb-4 group w-fit">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-all">
                <LayoutGrid className="h-5 w-5 text-white" />
              </div>
              <span className="gradient-text font-extrabold tracking-tight">StakePlatform</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-5">
              The most trusted crypto staking platform. Grow your digital assets with
              institutional-grade security and competitive daily returns.
            </p>
            <div className="flex gap-2">
              <a
                href="#"
                aria-label="Twitter"
                className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="mailto:support@stakeplatform.com"
                aria-label="Email"
                className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm mb-4 text-white/80">{category}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:pl-1 duration-200 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} StakePlatform.</span>
            <span className="text-white/20">|</span>
            <span>All rights reserved.</span>
          </div>
          <div className="flex gap-5 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/policy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
