import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Admin routes - only ADMIN
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Worker routes - only WORKER
    if (pathname.startsWith('/worker')) {
      if (token?.role !== 'WORKER' && token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Support routes - only SUPPORT
    if (pathname.startsWith('/support')) {
      if (token?.role !== 'SUPPORT' && token?.role !== 'WORKER' && token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        // Public routes - always allow
        const publicRoutes = [
          '/',
          '/about',
          '/policy',
          '/app-info',
          '/terms',
          '/faq',
          '/contact',
          '/plans',
          '/login',
          '/signup',
          '/auth-re-password',
        ]

        if (
          publicRoutes.some((route) => pathname === route) ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/favicon') ||
          pathname.startsWith('/uploads') ||
          pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)
        ) {
          return true
        }

        // All other routes require a fully authenticated token.
        // A twoFaPending token means password was correct but TOTP not yet
        // verified — treat as unauthenticated for all protected routes.
        return !!token && !token.twoFaPending
      },
    },
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
