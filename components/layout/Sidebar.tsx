'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  List,
  Users,
  Bell,
  MessageSquare,
  Receipt,
  Settings,
  LogOut,
  ChevronRight,
  TrendingDown,
  KeyRound,
  Wallet,
  X,
} from 'lucide-react'

interface SidebarLink {
  href: string
  label: string
  icon: React.ReactNode
  badge?: string
}

const userLinks: SidebarLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/deposit', label: 'Deposit', icon: <ArrowDownToLine className="h-4 w-4" /> },
  { href: '/withdraw', label: 'Withdraw', icon: <ArrowUpFromLine className="h-4 w-4" /> },
  { href: '/plans', label: 'Staking Plans', icon: <TrendingUp className="h-4 w-4" /> },
  { href: '/orders', label: 'My Stakes', icon: <List className="h-4 w-4" /> },
  { href: '/referrals', label: 'Referrals', icon: <Users className="h-4 w-4" /> },
  { href: '/notify', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  { href: '/ticket', label: 'Support', icon: <MessageSquare className="h-4 w-4" /> },
  { href: '/bill', label: 'Transactions', icon: <Receipt className="h-4 w-4" /> },
]

const settingsLinks: SidebarLink[] = [
  { href: '/settings', label: 'Profile', icon: <Settings className="h-4 w-4" /> },
  { href: '/settings/security', label: 'Security', icon: <TrendingDown className="h-4 w-4" /> },
  { href: '/settings/api-keys', label: 'API Keys', icon: <KeyRound className="h-4 w-4" /> },
  { href: '/settings/withdraw', label: 'Wallets', icon: <Wallet className="h-4 w-4" /> },
]

interface SidebarProps {
  collapsed?: boolean
  onClose?: () => void
}

export function Sidebar({ collapsed = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const initials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  const isActive = (href: string) => {
    if (href === '/settings') return pathname === '/settings'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-[100dvh] border-r border-border bg-background/95 backdrop-blur-sm transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-border flex-shrink-0">
        {collapsed ? (
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
              <defs><linearGradient id="slg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2563EB"/><stop offset="100%" stopColor="#7C3AED"/></linearGradient></defs>
              <polygon points="20,2 35,11 35,29 20,38 5,29 5,11" fill="url(#slg)"/>
              <rect x="12" y="10" width="13" height="5" rx="1.5" fill="white"/>
              <rect x="12" y="10" width="5" height="10" rx="1.5" fill="white"/>
              <rect x="12" y="17.5" width="16" height="5" rx="1.5" fill="white"/>
              <rect x="23" y="20" width="5" height="10" rx="1.5" fill="white"/>
              <rect x="15" y="25" width="13" height="5" rx="1.5" fill="white"/>
            </svg>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 flex-1">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 flex-shrink-0">
              <defs><linearGradient id="slg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2563EB"/><stop offset="100%" stopColor="#7C3AED"/></linearGradient></defs>
              <polygon points="20,2 35,11 35,29 20,38 5,29 5,11" fill="url(#slg2)"/>
              <rect x="12" y="10" width="13" height="5" rx="1.5" fill="white"/>
              <rect x="12" y="10" width="5" height="10" rx="1.5" fill="white"/>
              <rect x="12" y="17.5" width="16" height="5" rx="1.5" fill="white"/>
              <rect x="23" y="20" width="5" height="10" rx="1.5" fill="white"/>
              <rect x="15" y="25" width="13" height="5" rx="1.5" fill="white"/>
            </svg>
            <span className="font-extrabold tracking-tight text-base leading-none">
              <span className="text-muted-foreground">Stake</span><span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">onix</span>
            </span>
          </div>
        )}
        {/* Mobile close button */}
        {!collapsed && onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {!collapsed && (
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
            Main
          </p>
        )}
        {userLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className={cn(
              'nav-link',
              isActive(link.href) && 'active',
              collapsed && 'justify-center px-0'
            )}
            title={collapsed ? link.label : undefined}
          >
            {link.icon}
            {!collapsed && (
              <>
                <span className="flex-1">{link.label}</span>
                {link.badge && (
                  <Badge variant="success" className="text-xs px-1.5 py-0">
                    {link.badge}
                  </Badge>
                )}
              </>
            )}
          </Link>
        ))}

        {!collapsed && (
          <p className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
            Settings
          </p>
        )}
        {settingsLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className={cn(
              'nav-link',
              isActive(link.href) && 'active',
              collapsed && 'justify-center px-0'
            )}
            title={collapsed ? link.label : undefined}
          >
            {link.icon}
            {!collapsed && <span className="flex-1">{link.label}</span>}
          </Link>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-border">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg p-2 hover:bg-secondary cursor-pointer transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={session?.user?.avatar || ''} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{session?.user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-1 rounded text-muted-foreground hover:text-red-400 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
