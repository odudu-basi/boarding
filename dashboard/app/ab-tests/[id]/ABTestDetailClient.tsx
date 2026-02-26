'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Experiment, OnboardingConfig } from '@/lib/types'
import { Heading, Text, Card, Button } from '@/components/ui'
import { theme } from '@/lib/theme'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: '#f3f4f6', color: '#374151', label: 'Draft' },
  active: { bg: '#d1fae5', color: '#065f46', label: 'Active' },
  paused: { bg: '#fef3c7', color: '#92400e', label: 'Paused' },
  completed: { bg: '#dbeafe', color: '#1e40af', label: 'Completed' },
}

const VARIANT_COLORS = ['#f26522', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']

// ── Metric definitions ─────────────────────────────────────────────────

type MetricKey = 'completion_rate' | 'paywall_conversion_rate' | 'drop_off_rate' | 'unique_users' | 'total_events'

interface MetricDef {
  label: string
  description: string
  getValue: (v: any) => number
  format: (n: number) => string
  isRate: boolean
}

const METRICS: Record<MetricKey, MetricDef> = {
  completion_rate: {
    label: 'Completion Rate',
    description: 'Percentage of users who completed onboarding',
    getValue: (v) => parseFloat(v.completionRate),
    format: (n) => `${n.toFixed(1)}%`,
    isRate: true,
  },
  paywall_conversion_rate: {
    label: 'Paywall Conversion Rate',
    description: 'Percentage of users who converted after viewing the paywall',
    getValue: (v) => parseFloat(v.paywallConversionRate),
    format: (n) => `${n.toFixed(1)}%`,
    isRate: true,
  },
  drop_off_rate: {
    label: 'Drop-off Rate',
    description: 'Percentage of users who abandoned onboarding',
    getValue: (v) => parseFloat(v.dropOffRate),
    format: (n) => `${n.toFixed(1)}%`,
    isRate: true,
  },
  unique_users: {
    label: 'Unique Users',
    description: 'Total unique users assigned to each variant',
    getValue: (v) => v.uniqueUsers,
    format: (n) => n.toLocaleString(),
    isRate: false,
  },
  total_events: {
    label: 'Total Events',
    description: 'Total analytics events tracked per variant',
    getValue: (v) => v.totalEvents,
    format: (n) => n.toLocaleString(),
    isRate: false,
  },
}

// ── Component ──────────────────────────────────────────────────────────

interface ABTestDetailClientProps {
  experiment: Experiment
  organization: any
  variantMetrics: any[]
  totalUsers: number
  totalAssignments: number
  flows: OnboardingConfig[]
}

export function ABTestDetailClient({
  experiment,
  organization,
  variantMetrics,
  totalUsers,
  totalAssignments,
  flows
}: ABTestDetailClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [showEditModal, setShowEditModal] = useState(false)
  const [editVariants, setEditVariants] = useState(experiment.variants || [])
  const [saving, setSaving] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('completion_rate')

  const status = STATUS_STYLES[experiment.status] || STATUS_STYLES.draft
  const allMetrics = [experiment.primary_metric, ...(experiment.secondary_metrics || [])]

  // ── Comparison chart data ──

  const metricDef = METRICS[selectedMetric]

  const chartData = useMemo(() => {
    const values = variantMetrics.map((v: any) => ({
      name: v.name,
      color: v.color,
      weight: v.weight,
      value: metricDef.getValue(v),
    }))
    const maxValue = Math.max(...values.map(v => v.value), 1) // avoid division by zero
    return values.map(v => ({
      ...v,
      barWidth: metricDef.isRate ? v.value : (v.value / maxValue) * 100,
    }))
  }, [variantMetrics, selectedMetric, metricDef])

  // Find the "winner" — highest value for positive metrics, lowest for drop-off
  const winnerIndex = useMemo(() => {
    if (chartData.every(d => d.value === 0)) return -1
    if (selectedMetric === 'drop_off_rate') {
      // Lower is better
      const minVal = Math.min(...chartData.map(d => d.value))
      return chartData.findIndex(d => d.value === minVal)
    }
    const maxVal = Math.max(...chartData.map(d => d.value))
    return chartData.findIndex(d => d.value === maxVal)
  }, [chartData, selectedMetric])

  // ── Edit handlers ──

  const handleUpdateVariantFlow = async (variantIndex: number, newConfigId: string) => {
    const newConfig = flows.find(f => f.id === newConfigId)
    if (!newConfig) return

    const updated = [...editVariants]
    updated[variantIndex] = {
      ...updated[variantIndex],
      config_id: newConfigId,
      name: newConfig.name,
    }
    setEditVariants(updated)
  }

  const handleUpdateWeight = (variantIndex: number, newWeight: number) => {
    const updated = [...editVariants]
    updated[variantIndex] = {
      ...updated[variantIndex],
      weight: newWeight,
    }
    setEditVariants(updated)
  }

  const totalWeight = editVariants.reduce((sum: number, v: any) => sum + v.weight, 0)

  const handleSave = async () => {
    if (totalWeight !== 100) {
      toast('Weights must add up to 100%', 'error')
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('experiments')
      .update({ variants: editVariants })
      .eq('id', experiment.id)

    setSaving(false)

    if (error) {
      toast(`Failed to update experiment: ${error.message}`, 'error')
      return
    }

    toast('A/B test updated successfully!', 'success')
    setShowEditModal(false)
    router.refresh()
  }

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <Link
          href="/ab-tests"
          style={{
            color: theme.colors.textMuted, fontSize: theme.fontSizes.sm,
            textDecoration: 'none', display: 'block', marginBottom: theme.spacing.sm,
          }}
        >
          &larr; Back to A/B Tests
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <Heading level={1} serif>{experiment.name}</Heading>
            <span style={{
              backgroundColor: status.bg,
              color: status.color,
              fontSize: theme.fontSizes.sm,
              fontWeight: '600',
              padding: '0.25rem 0.75rem',
              borderRadius: theme.borderRadius.sm,
            }}>
              {status.label}
            </span>
          </div>
          <button
            onClick={() => {
              setEditVariants(experiment.variants || [])
              setShowEditModal(true)
            }}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              fontSize: theme.fontSizes.sm,
              fontWeight: '600',
              backgroundColor: 'transparent',
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.lg,
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
        </div>
        <div style={{ display: 'flex', gap: theme.spacing.lg, marginTop: theme.spacing.sm }}>
          {experiment.start_date && (
            <Text variant="muted" size="sm">
              Started {new Date(experiment.start_date).toLocaleDateString()}
            </Text>
          )}
          <Text variant="muted" size="sm">
            {totalAssignments || 0} users assigned
          </Text>
          <Text variant="muted" size="sm">
            Primary metric: {experiment.primary_metric?.replace(/_/g, ' ') || 'None'}
          </Text>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
        <Card padding="md">
          <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.sm }}>
            Total Users
          </Text>
          <Heading level={2} serif>{totalUsers}</Heading>
        </Card>
        <Card padding="md">
          <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.sm }}>
            Variants
          </Text>
          <Heading level={2} serif>{variantMetrics.length}</Heading>
        </Card>
        <Card padding="md">
          <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.sm }}>
            Total Events
          </Text>
          <Heading level={2} serif>{variantMetrics.reduce((sum: number, v: any) => sum + v.totalEvents, 0)}</Heading>
        </Card>
        <Card padding="md">
          <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.sm }}>
            Tracking Metrics
          </Text>
          <Heading level={2} serif>{allMetrics.length}</Heading>
        </Card>
      </div>

      {/* ── Comparison Chart ── */}
      <Card padding="lg" style={{ marginBottom: theme.spacing.xl }}>
        {/* Chart header with metric dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
          <Heading level={3} serif>Variant Comparison</Heading>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as MetricKey)}
            style={{
              padding: `${theme.spacing.xs} ${theme.spacing.md}`,
              fontSize: theme.fontSizes.sm,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              cursor: 'pointer',
              fontFamily: theme.fonts.sans,
            }}
          >
            {Object.entries(METRICS).map(([key, def]) => (
              <option key={key} value={key}>{def.label}</option>
            ))}
          </select>
        </div>

        {/* Metric description */}
        <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.lg }}>
          {metricDef.description}
        </Text>

        {/* Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          {chartData.map((d, i) => (
            <div key={i}>
              {/* Label row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    backgroundColor: d.color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: '700',
                  }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <Text size="sm" style={{ fontWeight: '500' }}>
                    {d.name}
                    <span style={{ color: theme.colors.textMuted, fontWeight: '400' }}> ({d.weight}%)</span>
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <Text size="sm" style={{ fontWeight: '700', color: d.color }}>
                    {metricDef.format(d.value)}
                  </Text>
                  {winnerIndex === i && chartData.some(x => x.value > 0) && (
                    <span style={{
                      fontSize: theme.fontSizes.xs,
                      fontWeight: '600',
                      color: selectedMetric === 'drop_off_rate' ? '#065f46' : '#065f46',
                      backgroundColor: '#d1fae5',
                      padding: '2px 8px',
                      borderRadius: theme.borderRadius.sm,
                    }}>
                      {selectedMetric === 'drop_off_rate' ? 'Lowest' : 'Leading'}
                    </span>
                  )}
                </div>
              </div>

              {/* Bar */}
              <div style={{
                width: '100%',
                height: 28,
                backgroundColor: theme.colors.background,
                borderRadius: theme.borderRadius.md,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.max(d.barWidth, d.value > 0 ? 2 : 0)}%`,
                  height: '100%',
                  backgroundColor: d.color,
                  borderRadius: theme.borderRadius.md,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {chartData.every(d => d.value === 0) && (
          <div style={{ textAlign: 'center', padding: `${theme.spacing.lg} 0` }}>
            <Text variant="muted" size="sm">
              No data yet for this metric. Data will appear once users start going through the experiment.
            </Text>
          </div>
        )}
      </Card>

      {/* ── Variant Performance Detail ── */}
      <Card padding="lg">
        <Heading level={3} serif style={{ marginBottom: theme.spacing.lg }}>
          Variant Performance
        </Heading>

        {variantMetrics.map((variant: any, index: number) => (
          <div key={variant.variant_id} style={{ marginBottom: theme.spacing.xl }}>
            {/* Variant Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: variant.color,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: theme.fontSizes.sm,
                  fontWeight: '600',
                }}>
                  {String.fromCharCode(65 + index)}
                </div>
                <Text style={{ fontWeight: '600', fontSize: theme.fontSizes.lg }}>
                  {variant.name} <span style={{ color: theme.colors.textMuted, fontWeight: '400' }}>({variant.weight}% traffic)</span>
                </Text>
              </div>
              <Text style={{ fontWeight: '600', fontSize: theme.fontSizes['2xl'], color: variant.color }}>
                {variant.completionRate}%
              </Text>
            </div>

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: theme.colors.background,
              borderRadius: theme.borderRadius.full,
              marginBottom: theme.spacing.md,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${variant.completionRate}%`,
                height: '100%',
                backgroundColor: variant.color,
                borderRadius: theme.borderRadius.full,
              }} />
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: theme.spacing.lg }}>
              <div>
                <Text size="sm" variant="muted">Users</Text>
                <Text style={{ fontWeight: '600' }}>{variant.uniqueUsers}</Text>
              </div>
              <div>
                <Text size="sm" variant="muted">Started</Text>
                <Text style={{ fontWeight: '600' }}>{variant.starts}</Text>
              </div>
              <div>
                <Text size="sm" variant="muted">Completed</Text>
                <Text style={{ fontWeight: '600' }}>{variant.completions}</Text>
              </div>
              <div>
                <Text size="sm" variant="muted">Paywall Conv.</Text>
                <Text style={{ fontWeight: '600' }}>{variant.paywallConversions}/{variant.paywallViews}</Text>
              </div>
              <div>
                <Text size="sm" variant="muted">Drop-offs</Text>
                <Text style={{ fontWeight: '600' }}>{variant.abandonments}</Text>
              </div>
            </div>
          </div>
        ))}
      </Card>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: theme.spacing.xl,
        }} onClick={() => setShowEditModal(false)}>
          <div
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.xl,
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Heading level={2} serif style={{ marginBottom: theme.spacing.lg }}>
              Edit A/B Test
            </Heading>

            {editVariants.map((variant: any, idx: number) => (
              <div key={idx} style={{ marginBottom: theme.spacing.lg, padding: theme.spacing.md, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.md }}>
                <Text style={{ fontWeight: '600', marginBottom: theme.spacing.sm }}>
                  Variant {String.fromCharCode(65 + idx)}
                </Text>

                {/* Flow Selector */}
                <div style={{ marginBottom: theme.spacing.sm }}>
                  <Text size="sm" variant="muted" style={{ marginBottom: theme.spacing.xs }}>
                    Onboarding Flow
                  </Text>
                  <select
                    value={variant.config_id || ''}
                    onChange={(e) => handleUpdateVariantFlow(idx, e.target.value)}
                    style={{
                      width: '100%',
                      padding: theme.spacing.sm,
                      fontSize: theme.fontSizes.sm,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                    }}
                  >
                    {flows.map(flow => (
                      <option key={flow.id} value={flow.id}>
                        {flow.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Weight Slider */}
                <div>
                  <Text size="sm" variant="muted" style={{ marginBottom: theme.spacing.xs }}>
                    Traffic Allocation: {variant.weight}%
                  </Text>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={variant.weight}
                    onChange={(e) => handleUpdateWeight(idx, Number(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: theme.colors.primary,
                    }}
                  />
                </div>
              </div>
            ))}

            <div style={{
              marginBottom: theme.spacing.md,
              padding: theme.spacing.sm,
              backgroundColor: totalWeight === 100 ? theme.colors.success : theme.colors.error,
              borderRadius: theme.borderRadius.md,
            }}>
              <Text size="sm" style={{ color: totalWeight === 100 ? theme.colors.successText : theme.colors.errorText, fontWeight: '600' }}>
                Total: {totalWeight}% {totalWeight !== 100 ? '(must equal 100%)' : '✓'}
              </Text>
            </div>

            <div style={{ display: 'flex', gap: theme.spacing.md }}>
              <Button
                variant="secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={saving || totalWeight !== 100}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
