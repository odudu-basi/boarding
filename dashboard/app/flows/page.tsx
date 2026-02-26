import { getPageContext } from '@/lib/get-page-context'
import { OnboardingConfig } from '@/lib/types'
import { FlowCard } from '@/components/FlowCard'
import { Layout } from '@/components/Layout'
import { Container, Button, Card, Heading, Text } from '@/components/ui'
import { theme } from '@/lib/theme'

export default async function FlowsPage() {
  const { supabase, organization, projects, currentProject } = await getPageContext()

  const configsQuery = supabase
    .from('onboarding_configs')
    .select('*')
    .eq('organization_id', organization.id)
    .order('updated_at', { ascending: false })

  if (currentProject) {
    configsQuery.eq('project_id', currentProject.id)
  }

  const { data: configs } = await configsQuery

  return (
    <Layout
      organizationName={organization.name}
      plan={organization.plan}
      projects={projects.map(p => ({ id: p.id, name: p.name, platform: p.platform }))}
      currentProjectId={currentProject?.id}
    >
      <Container>
        <div style={{ paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.xl }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.xl }}>
            <div>
              <Heading level={1} serif>Onboarding Flows</Heading>
              <Text variant="muted" style={{ marginTop: theme.spacing.xs }}>
                Create and manage your app onboarding experiences
              </Text>
            </div>
            <Button variant="primary" size="lg" href="/flows/new">
              + New Flow
            </Button>
          </div>

          {configs && configs.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: theme.spacing.lg }}>
              {configs.map((config: OnboardingConfig) => (
                <FlowCard key={config.id} config={config} />
              ))}
            </div>
          ) : (
            <Card padding="lg" style={{ textAlign: 'center', border: `2px dashed ${theme.colors.borderDashed}` }}>
              <Heading level={3} serif style={{ marginBottom: theme.spacing.sm }}>
                No flows yet
              </Heading>
              <Text variant="muted" style={{ marginBottom: theme.spacing.lg }}>
                Get started by creating your first onboarding flow
              </Text>
              <Button variant="primary" size="lg" href="/flows/new">
                Create Your First Flow
              </Button>
            </Card>
          )}
        </div>
      </Container>
    </Layout>
  )
}
