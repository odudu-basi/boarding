'use client'

import { useToast } from '@/components/Toast'

export function CopyButton({ text }: { text: string }) {
  const { toast } = useToast()
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    toast('Copied to clipboard', 'success')
  }

  return (
    <button
      onClick={handleCopy}
      className="px-4 py-2 rounded transition text-sm font-medium hover:opacity-80"
      style={{ backgroundColor: '#e5e0d8', color: '#1a1a1a' }}
    >
      Copy
    </button>
  )
}
