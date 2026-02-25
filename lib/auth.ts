import { NextAuthOptions, getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

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
    CredentialsProvider({
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

        // Log successful login
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
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.avatar = (user as any).avatar
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.user.avatar = token.avatar as string
      }
      return session
    },
  },
}

export const getAuthSession = () => getServerSession(authOptions)
