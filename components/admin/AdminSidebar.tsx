'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Users, TrendingUp, Wallet, ArrowUpFromLine, ArrowDownToLine,
  MessageSquare, Globe, Settings, Bell, Mail, FileText, Shield, LogOut,
  Menu, X, ChevronRight, History, CreditCard, Ticket
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/staking', label: 'Staking Plans', icon: TrendingUp },
  { href: '/admin/history-staking', label: 'Staking History', icon: History },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/deposits', label: 'Deposits', icon: ArrowDownToLine },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
  { href: '/admin/currenci-deposit', label: 'Deposit Currencies', icon: Wallet },
  { href: '/admin/currencies-withdrawal', label: 'Withdrawal Currencies', icon: Wallet },
  { href: '/admin/chat', label: 'Live Chat', icon: MessageSquare },
  { href: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { href: '/admin/domains', label: 'Domains', icon: Globe },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/bulk-email', label: 'Bulk Email', icon: Mail },
  { href: '/admin/logs', label: 'System Logs', icon: FileText },
  { href: '/admin/ip-blocklist', label: 'IP Blocklist', icon: Shield },
  { href: '/admin/run-staking-cron', label: 'Run Staking Cron', icon: TrendingUp },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        {!collapsed && (
          <Link href="/admin" className="text-lg font-bold gradient-text">
            Admin Panel
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground transition-colors hidden md:block"
        >
          <Menu className="h-4 w-4" />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground transition-colors md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && isActive && (
                <ChevronRight className="h-3.5 w-3.5 ml-auto" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all'
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border md:hidden transition-transform',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent />
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          'hidden md:flex flex-col h-screen sticky top-0 bg-card border-r border-border transition-all duration-300',
          collapsed ? 'w-14' : 'w-60'
        )}
      >
        <NavContent />
      </div>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-30 md:hidden p-2 rounded-lg bg-card border border-border shadow-lg"
      >
        <Menu className="h-4 w-4" />
      </button>
    </>
  )
}
