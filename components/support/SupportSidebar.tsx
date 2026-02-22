'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, MessageSquare, Globe, Bell, Settings,
  ChevronLeft, ChevronRight, LogOut, Menu, X, Ticket
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/support', icon: LayoutDashboard },
  { label: 'Users', href: '/support/users', icon: Users },
  { label: 'Live Chat', href: '/support/chat', icon: MessageSquare },
  { label: 'Tickets', href: '/support/tickets', icon: Ticket },
  { label: 'Domains', href: '/support/domains', icon: Globe },
  { label: 'Notifications', href: '/support/notifications', icon: Bell },
  { label: 'Settings', href: '/support/settings', icon: Settings },
]

export default function SupportSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && <span className="font-bold text-lg gradient-text">Support</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex items-center justify-center h-7 w-7 rounded hover:bg-secondary transition-colors ml-auto">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <button onClick={() => setMobileOpen(false)} className="md:hidden"><X className="h-5 w-5" /></button>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = item.href === '/support' ? pathname === '/support' : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors', active ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground', collapsed && 'justify-center px-2')}>
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>
      <div className="p-2 border-t border-border">
        <button onClick={() => signOut({ callbackUrl: '/login' })} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full', collapsed && 'justify-center px-2')}>
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button onClick={() => setMobileOpen(true)} className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg"><Menu className="h-5 w-5" /></button>
      {mobileOpen && <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />}
      <aside className={cn('hidden md:flex flex-col bg-card border-r border-border transition-all duration-300 flex-shrink-0', collapsed ? 'w-16' : 'w-60')}>
        <NavContent />
      </aside>
      <aside className={cn('md:hidden fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border w-64 transition-transform duration-300', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <NavContent />
      </aside>
    </>
  )
}
