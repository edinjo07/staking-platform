import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Hexagonal S icon — matches the StakeOnix brand mark */
export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-9 w-9', className)}
    >
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      {/* Hexagon background */}
      <polygon
        points="20,2 35,11 35,29 20,38 5,29 5,11"
        fill="url(#lg1)"
      />
      {/* S letter — geometric block style */}
      {/* Top bar */}
      <rect x="12" y="10" width="13" height="5" rx="1.5" fill="white" />
      {/* Left top arm */}
      <rect x="12" y="10" width="5" height="10" rx="1.5" fill="white" />
      {/* Middle bar */}
      <rect x="12" y="17.5" width="16" height="5" rx="1.5" fill="white" />
      {/* Right bottom arm */}
      <rect x="23" y="20" width="5" height="10" rx="1.5" fill="white" />
      {/* Bottom bar */}
      <rect x="15" y="25" width="13" height="5" rx="1.5" fill="white" />
    </svg>
  )
}

/** Full logo — icon + brand name. Wraps in a Link by default. */
export function Logo({
  size = 'md',
  className,
  linkClassName,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  linkClassName?: string
}) {
  const textSize =
    size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl'
  const iconSize =
    size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'

  return (
    <Link
      href="/"
      className={cn(
        'inline-flex items-center gap-2.5 font-extrabold tracking-tight group',
        linkClassName
      )}
    >
      <LogoIcon
        className={cn(
          iconSize,
          'transition-all duration-300 group-hover:scale-105 drop-shadow-[0_2px_8px_rgba(79,70,229,0.5)]',
          className
        )}
      />
      <span className={cn('leading-none', textSize)}>
        <span className="text-muted-foreground font-bold">Stake</span>
        <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent font-extrabold">
          onix
        </span>
      </span>
    </Link>
  )
}
