'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'

const ICONS = {
  success: (
    <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
    </svg>
  ),
  error: (
    <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6M9 9l6 6" />
    </svg>
  ),
  loading: (
    <svg className="w-16 h-16 text-yellow-400 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" strokeDasharray="40 60" />
    </svg>
  ),
}

const ERROR_MESSAGES: Record<string, string> = {
  missing:  'No verification token was provided.',
  invalid:  'This verification link is invalid or has already been used.',
  expired:  'This verification link has expired. Please request a new one.',
  already:  'Your email is already verified.',
  server:   'Something went wrong on our end. Please try again later.',
}

export default function VerifyEmailPage() {
  const params  = useSearchParams()
  const router  = useRouter()

  const success = params.get('success')
  const error   = params.get('error')

  // Auto-redirect countdown after success
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (!success) return
    if (countdown <= 0) { router.push('/login'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [success, countdown, router])

  // Resend form state
  const [email,   setEmail]   = useState('')
  const [resent,  setResent]  = useState(false)
  const [resendError, setResendError] = useState('')
  const [isPending, startTransition]  = useTransition()

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    setResendError('')
    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/resend-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        if (res.ok) setResent(true)
        else {
          const data = await res.json().catch(() => ({}))
          setResendError(data.error || 'Failed to resend. Please try again.')
        }
      } catch {
        setResendError('Network error. Please try again.')
      }
    })
  }

  const showResendForm = error === 'expired' || error === 'invalid' || error === 'missing'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] px-4">
      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-2xl p-8 text-center space-y-6">

        {/* Success */}
        {success && (
          <>
            <div className="flex justify-center">{ICONS.success}</div>
            <h1 className="text-2xl font-bold text-white">Email Verified!</h1>
            <p className="text-gray-400">
              Your email has been verified successfully. Redirecting to login in{' '}
              <span className="text-yellow-400 font-semibold">{countdown}s</span>…
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold transition"
            >
              Go to Login
            </Link>
          </>
        )}

        {/* Already verified */}
        {error === 'already' && (
          <>
            <div className="flex justify-center">{ICONS.success}</div>
            <h1 className="text-2xl font-bold text-white">Already Verified</h1>
            <p className="text-gray-400">Your email is already verified. You can sign in.</p>
            <Link
              href="/login"
              className="inline-block w-full py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold transition"
            >
              Sign In
            </Link>
          </>
        )}

        {/* Error */}
        {error && error !== 'already' && (
          <>
            <div className="flex justify-center">{ICONS.error}</div>
            <h1 className="text-2xl font-bold text-white">Verification Failed</h1>
            <p className="text-gray-400">{ERROR_MESSAGES[error] ?? 'An unexpected error occurred.'}</p>

            {showResendForm && !resent && (
              <form onSubmit={handleResend} className="space-y-3 text-left">
                <label className="block text-sm font-medium text-gray-300">
                  Resend verification email
                </label>
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                {resendError && <p className="text-red-400 text-sm">{resendError}</p>}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-semibold transition"
                >
                  {isPending ? 'Sending…' : 'Resend Verification Email'}
                </button>
              </form>
            )}

            {resent && (
              <p className="text-green-400 text-sm font-medium">
                A new verification email has been sent. Please check your inbox.
              </p>
            )}

            <Link href="/login" className="text-sm text-yellow-400 hover:underline block">
              Back to Login
            </Link>
          </>
        )}

        {/* Fallback — no params (direct visit) */}
        {!success && !error && (
          <>
            <div className="flex justify-center">{ICONS.loading}</div>
            <h1 className="text-2xl font-bold text-white">Verify Your Email</h1>
            <p className="text-gray-400">
              We&apos;ve sent you a verification link. Please check your inbox and click the link to activate your account.
            </p>
            <Link href="/login" className="text-sm text-yellow-400 hover:underline block">
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
