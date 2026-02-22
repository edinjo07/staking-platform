'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export default function CopyButton({ text, label = 'Copy Link' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" className="gap-2 shrink-0" onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
      {copied ? 'Copied!' : label}
    </Button>
  )
}
