import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      avatar?: string
    }
    twoFaPending?: boolean
    twoFaUserId?: string
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    avatar?: string
    twoFaPending?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    avatar?: string
    twoFaPending?: boolean
    twoFaUserId?: string
  }
}
