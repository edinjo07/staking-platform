'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  Settings,
  Bell,
  ChevronDown,
  LayoutGrid,
  Rocket,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/plans', label: 'Staking Plans' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQs' },
  { href: '/contact', label: 'Contact' },
]

export function Navbar() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <nav
      className={cn(
        'sticky top-0 z-40 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-white/10 bg-background/95 backdrop-blur-xl shadow-xl shadow-black/20'
          : 'border-b border-transparent bg-background/60 backdrop-blur-md'
      )}
    >
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/40 group-hover:shadow-cyan-500/60 transition-all duration-300 group-hover:scale-105">
            <LayoutGrid className="h-5 w-5 text-white" />
          </div>
          <span className="gradient-text font-extrabold tracking-tight">StakePlatform</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative flex items-center gap-1 px-3.5 py-2 text-sm transition-all rounded-xl',
                pathname === link.href
                  ? 'text-foreground bg-white/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              {link.label}
              {pathname === link.href && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full" />
              )}
            </Link>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
              >
                <Avatar className="h-7 w-7 ring-1 ring-white/10">
                  <AvatarImage src={session.user.avatar || ''} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-cyan-500 to-blue-600">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{session.user.name?.split(' ')[0]}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', userDropdown && 'rotate-180')} />
              </button>

              {userDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserDropdown(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-white/10 bg-card shadow-2xl shadow-black/50 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                      <p className="text-sm font-semibold">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-white/5 transition-colors"
                      onClick={() => setUserDropdown(false)}
                    >
                      <LayoutDashboard className="h-4 w-4 text-cyan-400" />
                      Dashboard
                    </Link>
                    <Link
                      href="/notify"
                      className="flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-white/5 transition-colors"
                      onClick={() => setUserDropdown(false)}
                    >
                      <Bell className="h-4 w-4 text-blue-400" />
                      Notifications
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-white/5 transition-colors"
                      onClick={() => setUserDropdown(false)}
                    >
                      <Settings className="h-4 w-4 text-purple-400" />
                      Settings
                    </Link>
                    <div className="border-t border-white/5">
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/5 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  size="sm"
                  className="gap-1.5 px-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105 font-semibold"
                >
                  <Rocket className="h-3.5 w-3.5" />
                  Start Earning
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl px-4 pb-5">
          <div className="pt-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center py-3 px-3 text-sm rounded-xl transition-colors',
                  pathname === link.href
                    ? 'text-foreground bg-white/5 font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex gap-2 pt-4 mt-2 border-t border-white/5">
            {session ? (
              <>
                <Link href="/dashboard" className="flex-1">
                  <Button
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 rounded-xl"
                    size="sm"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-red-400 hover:text-red-300"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full border-white/10" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" className="flex-1">
                  <Button
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 rounded-xl"
                    size="sm"
                  >
                    <Rocket className="h-3.5 w-3.5 mr-1.5" />
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
