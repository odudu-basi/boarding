import { getPageContext } from '@/lib/get-page-context'
import { CopyButton } from '@/components/CopyButton'
import { Layout } from '@/components/Layout'
import { Container, Card, Heading, Text } from '@/components/ui'
import { theme } from '@/lib/theme'

export default async function Home() {
  const { supabase, organization, projects, currentProject } = await getPageContext()

  // Get analytics summary scoped to current project
  const eventsQuery = supabase
    .from('analytics_events')
    .select('event_name, user_id')
    .eq('organization_id', organization.id)
    .limit(500)

  if (currentProject) {
    eventsQuery.eq('project_id', currentProject.id)
  }

  const { data: events } = await eventsQuery

  const totalEvents = events?.length || 0
  const uniqueUsers = new Set(events?.map((e) => e.user_id)).size
  const onboardingStarts = events?.filter((e) => e.event_name === 'onboarding_started').length || 0
  const onboardingCompletions = events?.filter((e) => e.event_name === 'onboarding_completed').length || 0
  const completionRate = onboardingStarts > 0 ? ((onboardingCompletions / onboardingStarts) * 100).toFixed(1) : '0'

  // Get revenue summary
  const { data: revenueCatEvents } = await supabase
    .from('revenuecat_events')
    .select('event_type, price')
    .limit(200)

  const totalRevenue = revenueCatEvents
    ?.filter((e: any) => e.event_type === 'INITIAL_PURCHASE' && e.price)
    .reduce((sum: number, e: any) => sum + parseFloat(e.price), 0) || 0

  // Use project API keys if available, fall back to org keys
  const testApiKey = currentProject?.test_api_key || organization.test_api_key
  const productionApiKey = currentProject?.production_api_key || organization.production_api_key

  return (
    <Layout
      organizationName={organization.name}
      plan={organization.plan}
      projects={projects.map(p => ({ id: p.id, name: p.name, platform: p.platform }))}
      currentProjectId={currentProject?.id}
    >
      <Container>
        <div style={{ paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.xl }}>
          {/* Page Header */}
          <div style={{ marginBottom: theme.spacing.xl }}>
            <Heading level={1} serif>Overview</Heading>
            <Text variant="muted" style={{ marginTop: theme.spacing.xs }}>
              Your onboarding performance at a glance
            </Text>
          </div>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: theme.spacing.md, marginBottom: theme.spacing.xl }}>
            <Card padding="md">
              <Text variant="muted" size="xs" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                Total Events
              </Text>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: theme.colors.text, fontFamily: theme.fonts.serif, marginTop: theme.spacing.xs }}>
                {totalEvents}
              </div>
            </Card>
            <Card padding="md">
              <Text variant="muted" size="xs" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                Unique Users
              </Text>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: theme.colors.text, fontFamily: theme.fonts.serif, marginTop: theme.spacing.xs }}>
                {uniqueUsers}
              </div>
            </Card>
            <Card padding="md">
              <Text variant="muted" size="xs" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                Completion Rate
              </Text>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: theme.colors.text, fontFamily: theme.fonts.serif, marginTop: theme.spacing.xs }}>
                {completionRate}%
              </div>
            </Card>
            <Card padding="md">
              <Text variant="muted" size="xs" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                Revenue
              </Text>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: theme.colors.text, fontFamily: theme.fonts.serif, marginTop: theme.spacing.xs }}>
                ${totalRevenue.toFixed(2)}
              </div>
            </Card>
          </div>

          {/* API Keys Section */}
          <Card padding="md" style={{ marginBottom: theme.spacing.xl }}>
            <Heading level={3} serif style={{ marginBottom: theme.spacing.sm }}>Your API Keys</Heading>
            <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.md }}>
              Use these keys in your React Native app
            </Text>

            {/* Test API Key */}
            <div style={{ marginBottom: theme.spacing.md }}>
              <Text size="sm" style={{ marginBottom: theme.spacing.xs, fontWeight: 500 }}>
                Test API Key
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <code
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.background,
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    borderRadius: theme.borderRadius.md,
                    fontFamily: theme.fonts.mono,
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.text,
                  }}
                >
                  {testApiKey}
                </code>
                <CopyButton text={testApiKey} />
              </div>
              <Text variant="muted" size="xs" style={{ marginTop: theme.spacing.xs }}>
                For development and testing
              </Text>
            </div>

            {/* Production API Key */}
            <div>
              <Text size="sm" style={{ marginBottom: theme.spacing.xs, fontWeight: 500 }}>
                Production API Key
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <code
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.background,
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    borderRadius: theme.borderRadius.md,
                    fontFamily: theme.fonts.mono,
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.text,
                  }}
                >
                  {productionApiKey}
                </code>
                <CopyButton text={productionApiKey} />
              </div>
              <Text variant="muted" size="xs" style={{ marginTop: theme.spacing.xs }}>
                For production builds
              </Text>
            </div>
          </Card>

        </div>
      </Container>
    </Layout>
  )
}
