import WorkerSidebar from '@/components/worker/WorkerSidebar'

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <WorkerSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
