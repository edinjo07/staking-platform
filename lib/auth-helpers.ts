export { getAuthSession } from '@/lib/auth'
import { getAuthSession } from '@/lib/auth'

export async function requireAuth() {
  const session = await getAuthSession()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (session.user.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required')
  }
  return session
}

export async function requireWorker() {
  const session = await requireAuth()
  if (!['ADMIN', 'WORKER'].includes(session.user.role)) {
    throw new Error('Forbidden: Worker access required')
  }
  return session
}

export async function requireSupport() {
  const session = await requireAuth()
  if (!['ADMIN', 'WORKER', 'SUPPORT'].includes(session.user.role)) {
    throw new Error('Forbidden: Support access required')
  }
  return session
}
