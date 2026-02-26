'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { theme } from '@/lib/theme'
import { Text } from '@/components/ui'

export function CheckoutSuccessBanner() {
  const searchParams = useSearchParams()
  const [dismissed, setDismissed] = useState(false)
  const isSuccess = searchParams.get('checkout') === 'success'

  if (!isSuccess || dismissed) return null

  return (
    <div style={{
      backgroundColor: theme.colors.success,
      border: `1px solid ${theme.colors.successText}`,
      color: theme.colors.successText,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.lg,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <Text size="sm" style={{ color: theme.colors.successText }}>
        Subscription activated successfully! Your credits have been added.
      </Text>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          color: theme.colors.successText,
          cursor: 'pointer',
          fontSize: theme.fontSizes.lg,
          padding: '0 4px',
        }}
      >
        ✕
      </button>
    </div>
  )
}
