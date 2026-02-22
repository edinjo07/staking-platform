'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TrendingUp, Mail, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type EmailForm = z.infer<typeof emailSchema>
type ResetForm = z.infer<typeof resetSchema>

function ForgotPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) })
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) })

  const onForgot = async (data: EmailForm) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })
      if (res.ok) {
        setSent(true)
        toast.success('Password reset instructions sent to your email.')
      } else {
        const result = await res.json()
        toast.error(result.error || 'Failed to send reset email.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const onReset = async (data: ResetForm) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      })
      if (res.ok) {
        toast.success('Password reset successfully! Please sign in.')
        router.push('/login')
      } else {
        const result = await res.json()
        toast.error(result.error || 'Invalid or expired reset link.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="glass-card p-8">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="gradient-text text-2xl">StakePlatform</span>
        </Link>
        <h1 className="text-2xl font-bold mt-4 mb-1">
          {token ? 'Set New Password' : sent ? 'Check Your Email' : 'Forgot Password?'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {token
            ? 'Enter your new password below.'
            : sent
            ? 'We sent a password reset link to your email.'
            : "Enter your email and we'll send you a reset link."}
        </p>
      </div>

      {/* Step 2: Token present — show new password form */}
      {token ? (
        <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                className="pl-9 pr-9"
                {...resetForm.register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {resetForm.formState.errors.password && (
              <p className="text-xs text-destructive">
                {resetForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Repeat password"
                className="pl-9"
                {...resetForm.register('confirmPassword')}
              />
            </div>
            {resetForm.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {resetForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" variant="gradient" className="w-full" loading={loading}>
            Reset Password
          </Button>
        </form>

      /* Step 1a: No token, not sent — show email form */
      ) : !sent ? (
        <form onSubmit={emailForm.handleSubmit(onForgot)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="your@email.com"
                className="pl-9"
                {...emailForm.register('email')}
              />
            </div>
            {emailForm.formState.errors.email && (
              <p className="text-xs text-destructive">
                {emailForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <Button type="submit" variant="gradient" className="w-full" loading={loading}>
            Send Reset Link
          </Button>
        </form>

      /* Step 1b: Email sent — confirmation message */
      ) : (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            If that email address is in our system, you will receive a password reset link
            within a few minutes.
          </p>
        </div>
      )}

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sign In
      </Link>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 animated-bg opacity-20 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        <Suspense fallback={<div className="glass-card p-8 h-[380px] animate-pulse rounded-2xl" />}>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
