import { requireWorker } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'

export default async function WorkerGroupLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireWorker()
  } catch {
    redirect('/login')
  }
  return <>{children}</>
}
