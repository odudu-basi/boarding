'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { theme } from '@/lib/theme'
import { Button, Card, Heading, Text } from '@/components/ui'

const SCALE_TIERS = [
  { credits: 700,  price: 100, priceId: 'price_1T4sP2I8BOMrgAxcCSNyeZlz' },
  { credits: 1000, price: 145, priceId: 'price_1T4sPkI8BOMrgAxcKWMGKS3U' },
  { credits: 2000, price: 290, priceId: 'price_1T4sQCI8BOMrgAxc6R53jZxr' },
  { credits: 3000, price: 430, priceId: 'price_1T4sQTI8BOMrgAxcmTJ1ebCw' },
  { credits: 5000, price: 715, priceId: 'price_1T4sQjI8BOMrgAxco8QqYKJf' },
]

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  )
}

function PricingContent() {
  const [selectedScaleIndex, setSelectedScaleIndex] = useState(0)
  const [loading, setLoading] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const checkoutCanceled = searchParams.get('checkout') === 'canceled'

  const selectedScale = SCALE_TIERS[selectedScaleIndex]

  const handleCheckout = async (priceId: string) => {
    setLoading(priceId)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (response.status === 401) {
        window.location.href = '/login?redirect=/pricing'
        return
      }

      if (!response.ok) {
        alert(data.error || 'Something went wrong')
        return
      }

      window.location.href = data.url
    } catch {
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const pricingTiers = [
    {
      name: 'Starter',
      priceId: 'price_1T4sDJI8BOMrgAxcwp6QasFi',
      price: 20,
      credits: 100,
      revenueFee: 1.5,
      popular: false,
      features: [
        '100 AI generation credits',
        '1.5% fee on user first transaction',
        'Basic analytics',
        'Standard support',
        'Email support',
      ],
    },
    {
      name: 'Developer',
      priceId: 'price_1T4sDxI8BOMrgAxcvXZtcdUk',
      price: 50,
      credits: 300,
      revenueFee: 1.25,
      popular: true,
      features: [
        '300 AI generation credits',
        '1.25% fee on user first transaction',
        'Advanced analytics',
        'Priority support',
        'A/B testing',
        'Custom branding',
      ],
    },
    {
      name: 'Scale',
      priceId: selectedScale.priceId,
      price: selectedScale.price,
      credits: selectedScale.credits,
      revenueFee: 0.75,
      popular: false,
      variable: true,
      features: [
        `${selectedScale.credits} AI generation credits`,
        '0.75% fee on user first transaction',
        'Advanced analytics',
        'Dedicated support',
        'A/B testing',
        'Custom branding',
        'API access',
        'Unlimited team members',
      ],
    },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f5f0', fontFamily: theme.fonts.sans }}>
      {/* ── Glassmorphic Navbar ── */}
      <nav style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 1100,
        background: 'rgba(255, 255, 255, 0.45)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 16,
        padding: '12px 28px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 100,
      }}>
        <a href="/landingpage" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: theme.fonts.serif,
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: '1.35rem',
            color: '#f26522',
          }}>
            Noboarding
          </span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="/landingpage#features" style={{
            textDecoration: 'none',
            fontSize: theme.fontSizes.sm,
            fontWeight: 500,
            color: '#1a1a1a',
          }}>
            Features
          </a>
          <a href="/pricing" style={{
            textDecoration: 'none',
            fontSize: theme.fontSizes.sm,
            fontWeight: 600,
            color: '#f26522',
          }}>
            Pricing
          </a>
          <a href="/docs" style={{
            textDecoration: 'none',
            fontSize: theme.fontSizes.sm,
            fontWeight: 500,
            color: '#1a1a1a',
          }}>
            Docs
          </a>
          <a href="/login" style={{
            textDecoration: 'none',
            fontSize: theme.fontSizes.sm,
            fontWeight: 500,
            color: '#1a1a1a',
          }}>
            Log in
          </a>
          <a href="/signup" style={{
            textDecoration: 'none',
            fontSize: theme.fontSizes.sm,
            fontWeight: 600,
            color: '#fff',
            backgroundColor: '#f26522',
            padding: '8px 22px',
            borderRadius: 10,
          }}>
            Sign up
          </a>
        </div>
      </nav>

      {/* Pricing Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: `120px ${theme.spacing.xl} ${theme.spacing['2xl']}` }}>
        {/* Intro Text */}
        <div style={{ textAlign: 'center', marginBottom: theme.spacing['2xl'] }}>
          <Heading level={1} serif style={{ marginBottom: theme.spacing.md }}>
            Simple, transparent pricing
          </Heading>
          <Text variant="muted" size="lg">
            Monthly subscription for credits. Small one-time fee on each user's first transaction.
          </Text>
        </div>

        {/* Checkout Canceled Banner */}
        {checkoutCanceled && (
          <div style={{
            backgroundColor: theme.colors.error,
            border: `1px solid ${theme.colors.errorText}`,
            color: theme.colors.errorText,
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing.lg,
            textAlign: 'center',
          }}>
            <Text size="sm" style={{ color: theme.colors.errorText }}>
              Checkout was canceled. You can try again when you're ready.
            </Text>
          </div>
        )}

        {/* Pricing Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: theme.spacing.lg,
          marginBottom: theme.spacing['2xl'],
        }}>
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              style={{
                padding: theme.spacing.xl,
                position: 'relative',
                border: tier.popular ? `2px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.surface,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Tier Name */}
              <Heading level={3} serif style={{ marginBottom: theme.spacing.sm }}>
                {tier.name}
              </Heading>

              {/* Price */}
              <div style={{ marginBottom: theme.spacing.lg }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing.xs }}>
                  <Heading level={1} serif style={{ fontSize: theme.fontSizes['4xl'], margin: 0 }}>
                    ${tier.price}
                  </Heading>
                  <Text variant="muted">
                    /month
                  </Text>
                </div>
              </div>

              {/* Credit Tier Dropdown for Scale */}
              {tier.variable && (
                <div style={{ marginBottom: theme.spacing.lg }}>
                  <Text size="sm" style={{ fontWeight: '500', marginBottom: theme.spacing.sm, display: 'block' }}>
                    Choose your credits
                  </Text>
                  <select
                    value={selectedScaleIndex}
                    onChange={(e) => setSelectedScaleIndex(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      borderRadius: theme.borderRadius.md,
                      border: `1px solid ${theme.colors.border}`,
                      backgroundColor: theme.colors.surface,
                      fontSize: theme.fontSizes.sm,
                      fontFamily: theme.fonts.sans,
                      color: theme.colors.text,
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                    }}
                  >
                    {SCALE_TIERS.map((scaleTier, idx) => (
                      <option key={scaleTier.credits} value={idx}>
                        {scaleTier.credits.toLocaleString()} credits — ${scaleTier.price}/mo
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Credits Info */}
              <div style={{
                backgroundColor: theme.colors.background,
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.md,
                marginBottom: theme.spacing.lg,
              }}>
                <div style={{ marginBottom: theme.spacing.sm }}>
                  <Text size="sm" style={{ fontWeight: '600' }}>
                    {tier.credits} Credits
                  </Text>
                  <Text variant="light" size="xs">
                    ~{tier.credits} AI screen generations
                  </Text>
                </div>
                <div>
                  <Text size="sm" style={{ fontWeight: '600', color: theme.colors.primary }}>
                    {tier.revenueFee}% Revenue Share
                  </Text>
                  <Text variant="light" size="xs">
                    On first transaction per user
                  </Text>
                </div>
              </div>

              {/* Features List */}
              <div style={{ flex: 1, marginBottom: theme.spacing.lg }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {tier.features.map((feature, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: theme.spacing.sm,
                        marginBottom: theme.spacing.sm,
                      }}
                    >
                      <span style={{ color: theme.colors.primary, fontSize: theme.fontSizes.lg }}>✓</span>
                      <Text size="sm">{feature}</Text>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <Button
                variant={tier.popular ? 'primary' : 'secondary'}
                onClick={() => handleCheckout(tier.priceId)}
                disabled={loading === tier.priceId}
                style={{
                  width: '100%',
                  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                  fontSize: theme.fontSizes.base,
                  fontWeight: '600',
                }}
              >
                {loading === tier.priceId ? 'Redirecting...' : 'Get Started'}
              </Button>
            </Card>
          ))}

          {/* Enterprise Card */}
          <Card
            style={{
              padding: theme.spacing.xl,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.surface,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Tier Name */}
            <Heading level={3} serif style={{ marginBottom: theme.spacing.sm }}>
              Enterprise
            </Heading>

            {/* Price */}
            <div style={{ marginBottom: theme.spacing.lg }}>
              <Heading level={1} serif style={{ fontSize: theme.fontSizes['4xl'], margin: 0, marginBottom: theme.spacing.xs }}>
                Custom
              </Heading>
              <Text variant="light" size="sm">
                Tailored to your needs
              </Text>
            </div>

            {/* Enterprise Info */}
            <div style={{
              backgroundColor: theme.colors.background,
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing.lg,
            }}>
              <Text size="sm" style={{ fontWeight: '600' }}>
                Custom Credits & Pricing
              </Text>
              <Text variant="light" size="xs">
                Volume discounts available
              </Text>
            </div>

            {/* Features List */}
            <div style={{ flex: 1, marginBottom: theme.spacing.lg }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  'Unlimited AI generations',
                  'Custom revenue share rates',
                  'White-label solution',
                  'Dedicated account manager',
                  'Custom integrations',
                  'SLA guarantees',
                  'Advanced security',
                  'Custom contract terms',
                ].map((feature, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: theme.spacing.sm,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    <span style={{ color: theme.colors.primary, fontSize: theme.fontSizes.lg }}>✓</span>
                    <Text size="sm">{feature}</Text>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button */}
            <Button
              variant="secondary"
              onClick={() => {
                // Placeholder - will be implemented later
                alert('Contact sales - Email/form integration coming soon!')
              }}
              style={{
                width: '100%',
                padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                fontSize: theme.fontSizes.base,
                fontWeight: '600',
              }}
            >
              Contact Sales
            </Button>
          </Card>
        </div>

        {/* FAQ or Additional Info */}
        <div style={{
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.xl,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.border}`,
        }}>
          <Heading level={3} serif style={{ marginBottom: theme.spacing.lg }}>
            How credits work
          </Heading>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: theme.spacing.lg,
          }}>
            <div>
              <Text style={{ fontWeight: '600', marginBottom: theme.spacing.xs }}>
                1 Credit = 1 Generation
              </Text>
              <Text variant="muted" size="sm">
                Each AI screen generation or edit uses approximately 1 credit (10,000 input + 1,000 output tokens).
              </Text>
            </div>
            <div>
              <Text style={{ fontWeight: '600', marginBottom: theme.spacing.xs }}>
                Revenue Sharing
              </Text>
              <Text variant="muted" size="sm">
                We charge a small percentage on each user's first transaction only. Not recurring. Lower rates for higher tiers.
              </Text>
            </div>
            <div>
              <Text style={{ fontWeight: '600', marginBottom: theme.spacing.xs }}>
                No Expiration
              </Text>
              <Text variant="muted" size="sm">
                Credits never expire. Use them at your own pace without any time pressure.
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
