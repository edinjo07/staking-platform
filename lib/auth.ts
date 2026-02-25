import { NextAuthOptions, getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import * as speakeasy from 'speakeasy'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    // ── Primary credentials (email + password) ────────────────────────
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        // Parse IP — x-forwarded-for may be "ip1, ip2" from proxy chains; take first
        const rawIp = (req.headers?.['x-forwarded-for'] as string) ||
                      (req.headers?.['x-real-ip'] as string) ||
                      'unknown'
        const ip = rawIp.split(',')[0].trim()
        const userAgent = req.headers?.['user-agent'] || ''

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user) {
          throw new Error('Invalid email or password')
        }

        if (!user.isActive || user.bannedAt) {
          throw new Error('Your account has been suspended')
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          // Log failed attempt — non-blocking, must not throw
          prisma.loginHistory.create({
            data: { userId: user.id, ipAddress: ip, userAgent, isSuccess: false },
          }).catch(() => {})
          throw new Error('Invalid email or password')
        }

        // ── 2FA gate ──────────────────────────────────────────────────
        // Password is correct but 2FA is enabled — return a pending marker.
        // The JWT callback will flag the session as twoFaPending so the
        // login page renders the TOTP challenge instead of redirecting.
        if (user.twoFaEnabled) {
          return {
            id: user.id,
            email: user.email,
            name: '',
            role: '',
            twoFaPending: true,
          } as any
        }

        // Log successful login (no 2FA required)
        try {
          await Promise.all([
            prisma.loginHistory.create({
              data: { userId: user.id, ipAddress: ip, userAgent, isSuccess: true },
            }),
            prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date(), lastLoginIp: ip },
            }),
          ])
        } catch {}

        return {
          id: user.id,
          email: user.email,
          name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || user.email,
          role: user.role,
          avatar: user.avatar ?? undefined,
        }
      },
    }),

    // ── 2FA completion provider ────────────────────────────────────────
    // Called only by POST /api/auth/2fa-verify after TOTP is validated.
    // A server-generated HMAC nonce prevents forging this credential.
    CredentialsProvider({
      id: 'two-factor',
      name: 'two-factor',
      credentials: {
        userId: { label: 'User ID', type: 'text' },
        nonce:  { label: 'Nonce',   type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.userId || !credentials?.nonce) return null

        const expected = await buildNonce(credentials.userId)
        if (credentials.nonce !== expected) {
          throw new Error('Invalid 2FA nonce')
        }

        const user = await prisma.user.findUnique({ where: { id: credentials.userId } })
        if (!user || !user.isActive || user.bannedAt) return null

        prisma.loginHistory.create({
          data: { userId: user.id, ipAddress: 'unknown', userAgent: '2fa-completion', isSuccess: true },
        }).catch(() => {})
        prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        }).catch(() => {})

        return {
          id: user.id,
          email: user.email,
          name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || user.email,
          role: user.role,
          avatar: user.avatar ?? undefined,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any
        if (u.twoFaPending) {
          // Partial token — holds userId only; no role until TOTP verified
          token.twoFaPending = true
          token.twoFaUserId  = u.id
          token.role  = ''
          token.avatar = undefined
        } else {
          token.twoFaPending = false
          token.twoFaUserId  = undefined
          token.role   = u.role
          token.avatar = u.avatar
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id     = token.sub as string
        session.user.role   = token.role as string
        session.user.avatar = token.avatar as string
        ;(session as any).twoFaPending = token.twoFaPending ?? false
        ;(session as any).twoFaUserId  = token.twoFaUserId ?? undefined
      }
      return session
    },
  },
}

// ── HMAC nonce helper ─────────────────────────────────────────────────────
// Signs userId after a successful TOTP validation so the two-factor
// provider cannot be called with an arbitrary userId.
export async function buildNonce(userId: string): Promise<string> {
  const secret  = process.env.NEXTAUTH_SECRET ?? 'fallback-secret'
  const data    = `${userId}:2fa-verified:${secret}`
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  return Buffer.from(sig).toString('hex')
}

export const getAuthSession = () => getServerSession(authOptions)
