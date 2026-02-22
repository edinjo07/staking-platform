import { requireSupport } from '@/lib/auth-helpers'

export default async function SupportGroupLayout({ children }: { children: React.ReactNode }) {
  const authRes = await requireSupport()
  if (authRes) return authRes
  return <>{children}</>
}
