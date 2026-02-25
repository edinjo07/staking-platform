'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  TrendingUp,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  Zap,
  BarChart3,
  ChevronRight,
  Smartphone,
} from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

function getRoleRedirect(role: string, callbackUrl: string): string {
  if (callbackUrl !== '/dashboard') return callbackUrl
  if (role === 'ADMIN') return '/admin'
  if (role === 'WORKER') return '/worker'
  if (role === 'SUPPORT') return '/support'
  return '/dashboard'
}

const perks = [
  {
    icon: <BarChart3 className="h-5 w-5 text-primary" />,
    title: 'Up to 365% APR',
    desc: 'Industry-leading staking returns, paid daily.',
  },
  {
    icon: <Zap className="h-5 w-5 text-yellow-400" />,
    title: 'Instant Daily Payouts',
    desc: 'Earnings credited automatically every 24 hours.',
  },
  {
    icon: <Shield className="h-5 w-5 text-blue-400" />,
    title: 'Bank-Grade Security',
    desc: '2FA, cold wallet storage & SSL encryption.',
  },
]

function LoginForm() {
  const searchParams = useSearchParams()
  const rawCallback = searchParams.get('callbackUrl') || '/dashboard'
  const callbackUrl = rawCallback.startsWith('/') ? rawCallback : '/dashboard'
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  // 2FA state
  const [twoFaStep, setTwoFaStep]   = useState(false)
  const [totpCode, setTotpCode]     = useState('')
  const [totpLoading, setTotpLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        const msg =
          result.error === 'CredentialsSignin'
            ? 'Invalid email or password'
            : result.error
        toast.error(msg)
        setLoading(false)
      } else {
        // Check if 2FA is pending
        const session = await getSession()
        if ((session as any)?.twoFaPending) {
          setTwoFaStep(true)
          setLoading(false)
          return
        }
        toast.success('Welcome back!')
        const role = session?.user?.role || 'USER'
        window.location.href = getRoleRedirect(role, callbackUrl)
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const onTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!totpCode.trim()) return
    setTotpLoading(true)
    try {
      const res  = await fetch('/api/auth/2fa-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpCode.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Invalid code')
        setTotpLoading(false)
        return
      }

      // Exchange the signed nonce for the real session
      const result = await signIn('two-factor', {
        userId: data.userId,
        nonce:  data.nonce,
        redirect: false,
      })

      if (result?.error) {
        toast.error('2FA verification failed. Please try again.')
        setTotpLoading(false)
        return
      }

      toast.success('Welcome back!')
      const session = await getSession()
      const role = session?.user?.role || 'USER'
      window.location.href = getRoleRedirect(role, callbackUrl)
    } catch {
      toast.error('Something went wrong. Please try again.')
      setTotpLoading(false)
    }
  }

  // ── 2FA challenge screen ─────────────────────────────────────────
  if (twoFaStep) {
    return (
      <div className="w-full space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
            <Smartphone className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>
        </div>

        <form onSubmit={onTotpSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="totp">Authentication Code</Label>
            <Input
              id="totp"
              type="text"
              inputMode="numeric"
              pattern="[0-9 ]*"
              maxLength={7}
              autoFocus
              autoComplete="one-time-code"
              placeholder="000 000"
              className="h-14 text-center text-2xl font-mono tracking-[0.5em] bg-secondary/40 border-border focus:border-primary/60"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>

          <Button
            type="submit"
            variant="gradient"
            className="w-full h-11 font-semibold text-base"
            disabled={totpLoading || totpCode.length < 6}
          >
            {totpLoading ? 'Verifying…' : 'Verify & Sign In'}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => { setTwoFaStep(false); setTotpCode('') }}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to sign in
        </button>
      </div>
    )
  }

  // ── Normal login form ─────────────────────────────────────────────────
  return (
    <div className="w-full space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Sign In</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back — sign in to your account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              className="pl-9 h-11 bg-secondary/40 border-border focus:border-primary/60"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/auth-re-password"
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="pl-9 pr-10 h-11 bg-secondary/40 border-border focus:border-primary/60"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="gradient"
          className="w-full h-11 font-semibold text-base"
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-primary hover:underline font-semibold">
          Create Account
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-secondary/30 flex-col justify-between p-12">
        <div className="absolute inset-0 animated-bg opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-transparent" />
        <div className="absolute top-1/3 left-1/3 h-72 w-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="gradient-text text-2xl font-bold">StakePlatform</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Passive income, simplified
            </p>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Grow Your Crypto <br />
              <span className="gradient-text">Every Single Day</span>
            </h2>
            <p className="text-muted-foreground max-w-sm">
              Join 15,000+ investors earning automatic daily staking rewards.
              Transparent plans, zero complexity.
            </p>
          </div>

          <div className="space-y-4">
            {perks.map((p) => (
              <div key={p.title} className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-secondary/60 border border-border">
                  {p.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            All systems operational &nbsp;&middot;&nbsp; 99.9% uptime
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col lg:w-[45%] bg-background">
        {/* Mobile logo */}
        <div className="flex items-center justify-between p-6 lg:hidden border-b border-border">
          <Link href="/" className="inline-flex items-center gap-2 font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="gradient-text text-lg font-bold">StakePlatform</span>
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
          >
            Sign up <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-8 lg:px-12">
          <div className="w-full max-w-sm">
            <Suspense
              fallback={<div className="h-64 w-full animate-pulse rounded-xl bg-secondary/40" />}
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>

        <div className="p-6 text-center border-t border-border">
          <p className="text-xs text-muted-foreground">
            Protected by 256-bit SSL encryption &nbsp;&middot;&nbsp;{' '}
            <Link href="/policy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
