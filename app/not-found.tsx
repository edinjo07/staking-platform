import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="relative">
          <div className="text-[120px] font-black gradient-text leading-none select-none">404</div>
          <div className="absolute inset-0 text-[120px] font-black text-transparent [-webkit-text-stroke:2px_rgba(255,255,255,0.05)] leading-none select-none">404</div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Page Not Found</h1>
          <p className="text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button variant="gradient" className="gap-2"><Home className="h-4 w-4" />Home</Button>
          </Link>
          <Link href="javascript:history.back()">
            <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Go Back</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
