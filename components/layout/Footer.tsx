import Link from 'next/link'
import { TrendingUp, Twitter, Github, Mail } from 'lucide-react'

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

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="gradient-text">StakePlatform</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              The most trusted staking platform. Grow your crypto assets with competitive
              daily returns and complete security.
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="#"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="mailto:support@stakeplatform.com"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-sm mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} StakePlatform. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/policy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
