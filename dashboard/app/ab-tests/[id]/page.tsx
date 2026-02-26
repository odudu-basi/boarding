import { getPageContext } from '@/lib/get-page-context'
import { Experiment } from '@/lib/types'
import { notFound } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { Container } from '@/components/ui'
import { theme } from '@/lib/theme'
import { ABTestDetailClient } from './ABTestDetailClient'

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: '#f3f4f6', color: '#374151', label: 'Draft' },
  active: { bg: '#d1fae5', color: '#065f46', label: 'Active' },
  paused: { bg: '#fef3c7', color: '#92400e', label: 'Paused' },
  completed: { bg: '#dbeafe', color: '#1e40af', label: 'Completed' },
}

const METRIC_LABELS: Record<string, string> = {
  onboarding_completion: 'Onboarding Completion',
  paywall_conversion: 'Paywall Conversion',
  time_to_complete: 'Time to Complete',
  drop_off_rate: 'Drop-off Rate',
}

// Simple color palette for variant bars
const VARIANT_COLORS = ['#f26522', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']

export default async function ABTestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, organization, projects, currentProject } = await getPageContext()

  // Fetch experiment
  const { data: experiment } = await supabase
    .from('experiments')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organization.id)
    .single()

  if (!experiment) notFound()

  const exp = experiment as Experiment
  const variants = exp.variants || []
  const status = STATUS_STYLES[exp.status] || STATUS_STYLES.draft

  // Fetch analytics events for this experiment
  const { data: events } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('organization_id', organization.id)
    .eq('experiment_id', id)
    .order('timestamp', { ascending: false })

  const allEvents = events || []

  // Fetch variant assignments count
  const { count: totalAssignments } = await supabase
    .from('variant_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('experiment_id', id)

  // Compute per-variant metrics
  const variantMetrics = variants.map((v: any, index: number) => {
    const variantEvents = allEvents.filter((e: any) => e.variant_id === v.variant_id)
    const uniqueUsers = new Set(variantEvents.map((e: any) => e.user_id)).size
    const starts = variantEvents.filter((e: any) => e.event_name === 'onboarding_started').length
    const completions = variantEvents.filter((e: any) => e.event_name === 'onboarding_completed').length
    const abandonments = variantEvents.filter((e: any) => e.event_name === 'onboarding_abandoned').length
    const paywallViews = variantEvents.filter((e: any) => e.event_name === 'paywall_viewed').length
    const paywallConversions = variantEvents.filter((e: any) => e.event_name === 'paywall_conversion').length

    return {
      ...v,
      color: VARIANT_COLORS[index % VARIANT_COLORS.length],
      uniqueUsers,
      totalEvents: variantEvents.length,
      starts,
      completions,
      abandonments,
      paywallViews,
      paywallConversions,
      completionRate: starts > 0 ? ((completions / starts) * 100).toFixed(1) : '0.0',
      dropOffRate: starts > 0 ? ((abandonments / starts) * 100).toFixed(1) : '0.0',
      paywallConversionRate: paywallViews > 0 ? ((paywallConversions / paywallViews) * 100).toFixed(1) : '0.0',
    }
  })

  const totalUsers = variantMetrics.reduce((sum: number, v: any) => sum + v.uniqueUsers, 0)

  // Fetch onboarding flows for edit modal (scoped to project if available)
  const flowsQuery = supabase
    .from('onboarding_configs')
    .select('*')
    .eq('organization_id', organization.id)
    .order('updated_at', { ascending: false })

  if (currentProject) {
    flowsQuery.eq('project_id', currentProject.id)
  }

  const { data: flows } = await flowsQuery

  return (
    <Layout
      organizationName={organization.name}
      plan={organization.plan}
      projects={projects.map(p => ({ id: p.id, name: p.name, platform: p.platform }))}
      currentProjectId={currentProject?.id}
    >
      <Container>
        <div style={{ paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.xl }}>
          <ABTestDetailClient
            experiment={exp}
            organization={organization}
            variantMetrics={variantMetrics}
            totalUsers={totalUsers}
            totalAssignments={totalAssignments || 0}
            flows={flows || []}
          />
        </div>
      </Container>
    </Layout>
  )
}
