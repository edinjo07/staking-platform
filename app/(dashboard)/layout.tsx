import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ChatWidget } from '@/components/chat/ChatWidget'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      {children}
      <ChatWidget />
    </DashboardLayout>
  )
}
