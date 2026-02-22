import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { requireAdmin } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminPagesLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin()
  } catch {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  )
}
