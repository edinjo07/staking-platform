import SupportSidebar from '@/components/support/SupportSidebar'

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SupportSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
