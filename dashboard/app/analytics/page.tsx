import { getPageContext } from '@/lib/get-page-context'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const { supabase, organization, currentProject } = await getPageContext()

  const projectId = currentProject?.id || null

  // Fetch configs
  let configsQuery = supabase
    .from('onboarding_configs')
    .select('*')
    .eq('organization_id', organization.id)

  if (projectId) {
    configsQuery = configsQuery.eq('project_id', projectId)
  }

  const { data: configs } = await configsQuery

  // Fetch events (default: last 30 days)
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  let eventsQuery = supabase
    .from('analytics_events')
    .select('*', { count: 'exact' })
    .eq('organization_id', organization.id)
    .gte('timestamp', startDate.toISOString())

  if (projectId) {
    eventsQuery = eventsQuery.eq('project_id', projectId)
  }

  const { data: eventsData, count } = await eventsQuery
    .order('timestamp', { ascending: false })
    .limit(5000)

  // Fetch RevenueCat events
  const { data: revData } = await supabase
    .from('revenuecat_events')
    .select('*')
    .order('purchased_at', { ascending: false })
    .limit(100)

  return (
    <AnalyticsClient
      initialData={{
        organization,
        initialEvents: eventsData || [],
        initialRevenueCatEvents: revData || [],
        initialConfigs: configs || [],
        initialCount: count || 0,
        projectId,
      }}
    />
  )
}
