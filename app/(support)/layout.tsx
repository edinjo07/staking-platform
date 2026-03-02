import { requireSupport } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'

export default async function SupportGroupLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireSupport()
  } catch {
    redirect('/login')
  }
  return <>{children}</>
}
