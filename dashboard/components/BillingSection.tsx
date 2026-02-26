'use client'

import { useState } from 'react'
import { theme } from '@/lib/theme'
import { Card, Heading, Text, Button } from '@/components/ui'

interface BillingSectionProps {
  plan: string
  subscriptionStatus: string | null
  hasStripeCustomer: boolean
}

export function BillingSection({ plan, subscriptionStatus, hasStripeCustomer }: BillingSectionProps) {
  const [loading, setLoading] = useState(false)

  const handleManageBilling = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to open billing portal')
        return
      }

      window.location.href = data.url
    } catch {
      alert('Failed to open billing portal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isPaid = plan !== 'free'

  return (
    <Card padding="md" style={{ marginBottom: theme.spacing.lg }}>
      <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
        Billing
      </Heading>

      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
        <Text variant="muted">
          Current plan:
        </Text>
        <span style={{
          display: 'inline-block',
          backgroundColor: isPaid ? 'rgba(242, 101, 34, 0.1)' : theme.colors.background,
          color: isPaid ? theme.colors.primary : theme.colors.text,
          fontSize: theme.fontSizes.xs,
          fontWeight: '600',
          padding: '0.25rem 0.625rem',
          borderRadius: theme.borderRadius.sm,
          textTransform: 'capitalize',
        }}>
          {plan}
        </span>
        {subscriptionStatus && subscriptionStatus !== 'none' && (
          <span style={{
            fontSize: theme.fontSizes.xs,
            color: subscriptionStatus === 'active' ? theme.colors.successText : theme.colors.errorText,
            fontWeight: '500',
          }}>
            ({subscriptionStatus})
          </span>
        )}
      </div>

      {isPaid && hasStripeCustomer ? (
        <div>
          <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.md }}>
            Manage your subscription, update payment methods, or download invoices.
          </Text>
          <Button
            variant="secondary"
            onClick={handleManageBilling}
            disabled={loading}
          >
            {loading ? 'Opening...' : 'Manage Billing'}
          </Button>
        </div>
      ) : (
        <div>
          <Text style={{ marginBottom: theme.spacing.md }}>
            Upgrade to unlock:
          </Text>
          <ul style={{ marginLeft: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
            <li style={{ marginBottom: theme.spacing.xs }}>
              <Text size="sm">Unlimited onboarding flows</Text>
            </li>
            <li style={{ marginBottom: theme.spacing.xs }}>
              <Text size="sm">Advanced analytics</Text>
            </li>
            <li style={{ marginBottom: theme.spacing.xs }}>
              <Text size="sm">A/B testing</Text>
            </li>
            <li style={{ marginBottom: theme.spacing.xs }}>
              <Text size="sm">Priority support</Text>
            </li>
          </ul>
          <Button variant="primary" href="/pricing">
            View Plans
          </Button>
        </div>
      )}
    </Card>
  )
}
