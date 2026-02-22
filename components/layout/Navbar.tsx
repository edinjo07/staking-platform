'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  TrendingUp,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  Settings,
  Bell,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/plans', label: 'Plans' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
]

export function Navbar() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)

  const initials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="gradient-text">StakePlatform</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-secondary transition-colors"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={session.user.avatar || ''} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{session.user.name?.split(' ')[0]}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {userDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-background shadow-xl">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-secondary transition-colors rounded-t-xl"
                    onClick={() => setUserDropdown(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/notify"
                    className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-secondary transition-colors"
                    onClick={() => setUserDropdown(false)}
                  >
                    <Bell className="h-4 w-4" />
                    Notifications
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-secondary transition-colors"
                    onClick={() => setUserDropdown(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-secondary transition-colors rounded-b-xl"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="gradient" size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-secondary"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-3 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-3 border-t border-border mt-3">
            {session ? (
              <>
                <Link href="/dashboard" className="flex-1">
                  <Button variant="secondary" className="w-full" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-red-400"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="flex-1">
                  <Button variant="secondary" className="w-full" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" className="flex-1">
                  <Button variant="gradient" className="w-full" size="sm">
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
