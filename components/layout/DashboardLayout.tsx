'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Sidebar } from './Sidebar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell, Menu, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

function getBreadcrumb(pathname: string): string[] {
  const segments = pathname.split('/').filter(Boolean)
  return segments.map((seg) =>
    seg
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
  )
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const breadcrumbs = getBreadcrumb(pathname)

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const initials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  const handleMenuClick = () => {
    // On mobile (<md), toggle the drawer; on desktop toggle collapse
    if (window.innerWidth < 768) {
      setMobileOpen((prev) => !prev)
    } else {
      setCollapsed((prev) => !prev)
    }
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Mobile backdrop overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — desktop: inline flow, mobile: fixed drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 md:relative md:z-auto md:translate-x-0 transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar
          collapsed={collapsed}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={handleMenuClick}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Breadcrumb — desktop only */}
            <nav className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
                  <span className={cn(i === breadcrumbs.length - 1 && 'text-foreground font-medium')}>
                    {crumb}
                  </span>
                </span>
              ))}
            </nav>
            {/* Page title — mobile only */}
            <span className="md:hidden text-sm font-semibold text-foreground capitalize">
              {breadcrumbs[breadcrumbs.length - 1] || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/notify">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/settings">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={session?.user?.avatar || ''} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
