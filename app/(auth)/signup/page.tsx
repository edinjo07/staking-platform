'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TrendingUp, Eye, EyeOff, Lock, Mail, User, Gift, Shield, Users, BarChart3, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'

const highlights = [
  {
    icon: <BarChart3 className="h-5 w-5 text-primary" />,
    title: '100% Transparent Returns',
    desc: 'Fixed daily ROI with no hidden fees or surprise deductions.',
  },
  {
    icon: <Users className="h-5 w-5 text-yellow-400" />,
    title: 'Referral Rewards',
    desc: 'Earn commissions when friends you invite start staking.',
  },
  {
    icon: <Shield className="h-5 w-5 text-blue-400" />,
    title: 'Non-Custodial Option',
    desc: 'You stay in control — withdraw anytime, no lockups.',
  },
]

const schema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

function SignupForm() {
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref') || ''
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { referralCode: refCode },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      // Omit confirmPassword — not needed by the API
      const { confirmPassword: _, ...payload } = data
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || 'Registration failed')
        setLoading(false)
        return
      }

      // Auto sign in after registration
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInResult?.error) {
        toast.success('Account created! Please sign in.')
        window.location.href = '/login'
      } else {
        toast.success('Account created successfully! Welcome to StakePlatform!')
        window.location.href = '/dashboard'
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="w-full space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="text-sm text-muted-foreground">Join thousands of investors today</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input placeholder="John" className="pl-9 h-11 bg-secondary/40" {...register('firstName')} />
            </div>
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Last Name</Label>
            <Input placeholder="Doe" className="h-11 bg-secondary/40" {...register('lastName')} />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="email"
              placeholder="your@email.com"
              className="pl-9 h-11 bg-secondary/40"
              {...register('email')}
            />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              className="pl-9 pr-10 h-11 bg-secondary/40"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="password"
              placeholder="Repeat password"
              className="pl-9 h-11 bg-secondary/40"
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center justify-between">
            <span>Referral Code <span className="text-muted-foreground">(optional)</span></span>
            {refCode && (
              <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                ✓ Code applied
              </span>
            )}
          </Label>
          <div className="relative">
            <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Enter referral code"
              className={`pl-9 h-11 ${refCode ? 'border-green-500/50 bg-green-500/5' : 'bg-secondary/40'}`}
              {...register('referralCode')}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/policy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <Button type="submit" variant="gradient" className="w-full h-11 font-semibold text-base" disabled={loading}>
          {loading ? 'Creating Account…' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-secondary/30 flex-col justify-between p-12">
        <div className="absolute inset-0 animated-bg opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-transparent" />
        <div className="absolute top-1/4 right-1/4 h-72 w-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/3 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

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
              Start earning in minutes
            </p>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Your First Daily <br />
              <span className="gradient-text">Reward Awaits</span>
            </h2>
            <p className="text-muted-foreground max-w-sm">
              Create a free account, deposit crypto, choose a plan — and earn passive income on autopilot.
            </p>
          </div>

          <div className="space-y-4">
            {highlights.map((h) => (
              <div key={h.title} className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-secondary/60 border border-border">
                  {h.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm">{h.title}</p>
                  <p className="text-xs text-muted-foreground">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-primary">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Free to join &nbsp;&middot;&nbsp; No credit card required
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
            href="/login"
            className="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Sign in
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-8 lg:px-12">
          <div className="w-full max-w-sm">
            <Suspense
              fallback={<div className="h-96 w-full animate-pulse rounded-xl bg-secondary/40" />}
            >
              <SignupForm />
            </Suspense>
          </div>
        </div>

        <div className="p-6 text-center border-t border-border">
          <p className="text-xs text-muted-foreground">
            Protected by 256-bit SSL encryption &nbsp;&middot;&nbsp;{' '}
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
