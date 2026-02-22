import { requireAdmin } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin()
  } catch {
    redirect('/login')
  }

  return <>{children}</>
}
