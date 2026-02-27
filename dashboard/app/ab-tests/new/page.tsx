'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OnboardingConfig } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { Container, Heading, Text } from '@/components/ui'
import { theme } from '@/lib/theme'
import { useToast } from '@/components/Toast'

const DEFAULT_METRICS = [
  { id: 'onboarding_completion', label: 'Onboarding Completion', description: 'Percentage of users who finish the entire flow', default: true },
  { id: 'paywall_conversion', label: 'Paywall Conversion', description: 'Percentage of users who convert on the paywall (tracked via RevenueCat webhooks)', default: true },
  { id: 'time_to_complete', label: 'Time to Complete', description: 'Average time to finish the onboarding', default: false },
  { id: 'drop_off_rate', label: 'Drop-off Rate', description: 'Where users abandon the onboarding flow', default: false },
]

interface VariantDraft {
  id: string
  config_id: string
  config_name: string
  weight: number
}

export default function NewABTestPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [flows, setFlows] = useState<OnboardingConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('free')

  // Form state
  const [testName, setTestName] = useState('')
  const [variants, setVariants] = useState<VariantDraft[]>([])
  const [primaryMetric, setPrimaryMetric] = useState('onboarding_completion')
  const [secondaryMetrics, setSecondaryMetrics] = useState<string[]>(
    DEFAULT_METRICS.filter(m => m.default && m.id !== 'onboarding_completion').map(m => m.id)
  )
  const [showFlowPicker, setShowFlowPicker] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: userOrgs } = await supabase
      .from('users')
      .select('organization_id, organizations(*)')
      .eq('auth_user_id', user.id)
      .single()

    if (!userOrgs?.organizations) return

    const org = userOrgs.organizations as any
    setOrgId(org.id)
    setSubscriptionPlan(org.plan || 'free')

    const { data: configs } = await supabase
      .from('onboarding_configs')
      .select('*')
      .eq('organization_id', org.id)
      .order('updated_at', { ascending: false })

    setFlows(configs || [])
    setLoading(false)
  }

  const addVariant = (config: OnboardingConfig) => {
    if (variants.some(v => v.config_id === config.id)) return

    // Enforce variant limits based on subscription plan
    const variantLimit = (subscriptionPlan === 'free' || subscriptionPlan === 'starter') ? 2 : Infinity
    if (variants.length >= variantLimit) {
      toast(`Your ${subscriptionPlan} plan supports up to ${variantLimit} variants. Upgrade to add more.`, 'error')
      setShowFlowPicker(false)
      return
    }

    const newVariant: VariantDraft = {
      id: `variant_${Date.now()}`,
      config_id: config.id,
      config_name: config.name,
      weight: 0,
    }

    const updated = [...variants, newVariant]
    // Auto-distribute weights evenly
    const evenWeight = Math.floor(100 / updated.length)
    const remainder = 100 - (evenWeight * updated.length)
    updated.forEach((v, i) => {
      v.weight = evenWeight + (i === 0 ? remainder : 0)
    })

    setVariants(updated)
    setShowFlowPicker(false)
  }

  const removeVariant = (id: string) => {
    const updated = variants.filter(v => v.id !== id)
    if (updated.length > 0) {
      const evenWeight = Math.floor(100 / updated.length)
      const remainder = 100 - (evenWeight * updated.length)
      updated.forEach((v, i) => {
        v.weight = evenWeight + (i === 0 ? remainder : 0)
      })
    }
    setVariants(updated)
  }

  const updateWeight = (id: string, weight: number) => {
    setVariants(variants.map(v => v.id === id ? { ...v, weight } : v))
  }

  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0)
  const isValid = testName.trim() && variants.length >= 2 && totalWeight === 100

  const toggleSecondaryMetric = (metricId: string) => {
    if (metricId === primaryMetric) return
    setSecondaryMetrics(prev =>
      prev.includes(metricId) ? prev.filter(m => m !== metricId) : [...prev, metricId]
    )
  }

  const handleCreate = async () => {
    if (!isValid || !orgId) return
    setSaving(true)

    // Fetch the full configs for each variant to copy their screens
    const variantsWithScreens = await Promise.all(
      variants.map(async (v) => {
        const { data: config } = await supabase
          .from('onboarding_configs')
          .select('config')
          .eq('id', v.config_id)
          .single()

        return {
          variant_id: v.id,
          name: v.config_name,
          weight: v.weight,
          config_id: v.config_id,
          screens: config?.config?.screens || [], // Copy the actual screens!
        }
      })
    )

    // Read selected project from cookie
    const projectCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('selected_project='))
      ?.split('=')[1]

    const { data, error } = await supabase
      .from('experiments')
      .insert({
        organization_id: orgId,
        project_id: projectCookie || null,
        name: testName.trim(),
        status: 'active',
        traffic_allocation: 100,
        variants: variantsWithScreens,
        primary_metric: primaryMetric,
        secondary_metrics: secondaryMetrics,
        start_date: new Date().toISOString(),
      })
      .select()
      .single()

    setSaving(false)

    if (error) {
      toast(`Failed to create test: ${error.message}`, 'error')
      return
    }

    router.push(`/ab-tests/${data.id}`)
  }

  if (loading) {
    return (
      <Layout>
        <Container>
          <div style={{ paddingTop: theme.spacing.xl, textAlign: 'center' }}>
            <Text variant="muted">Loading...</Text>
          </div>
        </Container>
      </Layout>
    )
  }

  const availableFlows = flows.filter(f => !variants.some(v => v.config_id === f.id))

  return (
    <Layout>
      <Container>
        <div style={{ paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.xl, maxWidth: '720px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: theme.spacing.xl }}>
            <button
              onClick={() => router.push('/ab-tests')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: theme.colors.textMuted, fontSize: theme.fontSizes.sm,
                padding: 0, marginBottom: theme.spacing.sm, display: 'block',
              }}
            >
              &larr; Back to A/B Tests
            </button>
            <Heading level={1} serif>New A/B Test</Heading>
            <Text variant="muted" style={{ marginTop: theme.spacing.xs }}>
              Compare onboarding flows to find which performs best
            </Text>
          </div>

          {/* Test Name */}
          <section style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
          }}>
            <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>Test Name</Heading>
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g., Onboarding v2 vs v3"
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                fontSize: theme.fontSizes.base,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontFamily: theme.fonts.sans,
                color: theme.colors.text,
                boxSizing: 'border-box',
              }}
            />
          </section>

          {/* Variants */}
          <section style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
              <Heading level={3} serif>Variants</Heading>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                {(subscriptionPlan === 'free' || subscriptionPlan === 'starter') && (
                  <Text variant="muted" size="sm">
                    <span style={{ fontWeight: '700', color: variants.length >= 2 ? theme.colors.errorText : theme.colors.text }}>
                      {variants.length}/2
                    </span> variants
                  </Text>
                )}
                <Text variant="muted" size="sm">
                  Total: <span style={{
                    fontWeight: '700',
                    color: totalWeight === 100 ? theme.colors.successText : theme.colors.errorText,
                  }}>{totalWeight}%</span> / 100%
                </Text>
              </div>
            </div>

            {variants.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: theme.spacing.xl,
                border: `2px dashed ${theme.colors.borderDashed}`,
                borderRadius: theme.borderRadius.md,
                marginBottom: theme.spacing.md,
              }}>
                <Text variant="muted">Add at least 2 onboarding flows to compare</Text>
              </div>
            )}

            {variants.map((variant, index) => (
              <div key={variant.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.md,
                padding: theme.spacing.md,
                backgroundColor: theme.colors.background,
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.border}`,
                marginBottom: theme.spacing.sm,
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: theme.colors.primary,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: theme.fontSizes.sm,
                  fontWeight: '700',
                  flexShrink: 0,
                }}>
                  {String.fromCharCode(65 + index)}
                </div>
                <div style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', fontSize: theme.fontSizes.sm }}>{variant.config_name}</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={variant.weight}
                    onChange={(e) => updateWeight(variant.id, parseInt(e.target.value) || 0)}
                    style={{
                      width: '64px',
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      fontSize: theme.fontSizes.sm,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.sm,
                      textAlign: 'center',
                      fontFamily: theme.fonts.sans,
                    }}
                  />
                  <Text variant="muted" size="sm">%</Text>
                </div>
                <button
                  onClick={() => removeVariant(variant.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: theme.colors.textLight, fontSize: '18px', padding: '4px',
                  }}
                  title="Remove variant"
                >
                  &times;
                </button>
              </div>
            ))}

            {/* Add variant button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowFlowPicker(!showFlowPicker)}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  fontSize: theme.fontSizes.sm,
                  fontWeight: '500',
                  color: theme.colors.primary,
                  backgroundColor: 'transparent',
                  border: `1px dashed ${theme.colors.primary}`,
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  marginTop: theme.spacing.xs,
                }}
              >
                + Add Onboarding Flow
              </button>

              {/* Flow picker dropdown */}
              {showFlowPicker && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 10,
                  maxHeight: '240px',
                  overflowY: 'auto',
                  marginTop: '4px',
                }}>
                  {availableFlows.length === 0 ? (
                    <div style={{ padding: theme.spacing.md, textAlign: 'center' }}>
                      <Text variant="muted" size="sm">
                        {flows.length === 0 ? 'No onboarding flows found. Create one first.' : 'All flows already added.'}
                      </Text>
                    </div>
                  ) : (
                    availableFlows.map((flow) => (
                      <button
                        key={flow.id}
                        onClick={() => addVariant(flow)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          borderBottom: `1px solid ${theme.colors.border}`,
                          fontFamily: theme.fonts.sans,
                        }}
                        className="hover:bg-gray-50"
                      >
                        <div style={{ fontWeight: '500', fontSize: theme.fontSizes.sm, color: theme.colors.text }}>
                          {flow.name}
                        </div>
                        <div style={{ fontSize: theme.fontSizes.xs, color: theme.colors.textMuted, marginTop: '2px' }}>
                          {flow.config.screens.length} screen{flow.config.screens.length !== 1 ? 's' : ''} &middot; v{flow.version}
                          {flow.is_published && ' &middot; Published'}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Metrics */}
          <section style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.xl,
          }}>
            <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>Metrics</Heading>
            <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.md }}>
              Choose what to measure. The primary metric is used to determine the winner.
            </Text>

            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              {DEFAULT_METRICS.map((metric) => {
                const isPrimary = primaryMetric === metric.id
                const isSecondary = secondaryMetrics.includes(metric.id)
                const isSelected = isPrimary || isSecondary

                return (
                  <div
                    key={metric.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.md,
                      padding: theme.spacing.md,
                      backgroundColor: isPrimary ? '#fff7ed' : isSecondary ? theme.colors.background : 'transparent',
                      borderRadius: theme.borderRadius.md,
                      border: `1px solid ${isPrimary ? theme.colors.primary + '40' : isSecondary ? theme.colors.border : 'transparent'}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleSecondaryMetric(metric.id)}
                  >
                    <div style={{
                      width: '20px', height: '20px',
                      borderRadius: '4px',
                      border: `2px solid ${isSelected ? theme.colors.primary : theme.colors.border}`,
                      backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isSelected && <span style={{ color: '#fff', fontSize: '12px', fontWeight: '700' }}>&#10003;</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                        <Text style={{ fontWeight: '500', fontSize: theme.fontSizes.sm }}>{metric.label}</Text>
                        {isPrimary && (
                          <span style={{
                            fontSize: '10px', fontWeight: '700',
                            color: theme.colors.primary,
                            backgroundColor: theme.colors.primary + '15',
                            padding: '1px 6px', borderRadius: '4px',
                          }}>PRIMARY</span>
                        )}
                      </div>
                      <Text variant="muted" size="xs" style={{ marginTop: '2px' }}>{metric.description}</Text>
                    </div>
                    {!isPrimary && isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPrimaryMetric(metric.id)
                          setSecondaryMetrics(prev => prev.filter(m => m !== metric.id))
                          // Move old primary to secondary
                          setSecondaryMetrics(prev => [...prev.filter(m => m !== metric.id), primaryMetric])
                        }}
                        style={{
                          padding: '2px 8px', fontSize: '11px', fontWeight: '500',
                          backgroundColor: 'transparent', color: theme.colors.textMuted,
                          border: `1px solid ${theme.colors.border}`, borderRadius: '4px',
                          cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        Set as primary
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Create Button */}
          <div style={{ display: 'flex', gap: theme.spacing.md }}>
            <button
              onClick={() => router.push('/ab-tests')}
              style={{
                padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                fontSize: theme.fontSizes.base,
                fontWeight: '600',
                backgroundColor: 'transparent',
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.lg,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!isValid || saving}
              style={{
                flex: 1,
                padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                fontSize: theme.fontSizes.base,
                fontWeight: '600',
                backgroundColor: isValid ? theme.colors.primary : theme.colors.border,
                color: '#fff',
                border: 'none',
                borderRadius: theme.borderRadius.lg,
                cursor: isValid && !saving ? 'pointer' : 'not-allowed',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Creating...' : 'Create & Start Test'}
            </button>
          </div>

          {/* Validation hints */}
          {!isValid && variants.length > 0 && (
            <div style={{ marginTop: theme.spacing.md }}>
              {!testName.trim() && (
                <Text variant="muted" size="xs" style={{ color: theme.colors.errorText }}>Give your test a name</Text>
              )}
              {variants.length < 2 && (
                <Text variant="muted" size="xs" style={{ color: theme.colors.errorText }}>Add at least 2 variants</Text>
              )}
              {totalWeight !== 100 && variants.length >= 2 && (
                <Text variant="muted" size="xs" style={{ color: theme.colors.errorText }}>
                  Percentages must add up to 100% (currently {totalWeight}%)
                </Text>
              )}
            </div>
          )}
        </div>
      </Container>
    </Layout>
  )
}
