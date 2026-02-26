import { getPageContext } from '@/lib/get-page-context'
import { Experiment } from '@/lib/types'
import { Layout } from '@/components/Layout'
import { Container, Button, Card, Heading, Text } from '@/components/ui'
import { theme } from '@/lib/theme'
import Link from 'next/link'
import { ExperimentCardActions } from '@/components/ExperimentCardActions'

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: '#f3f4f6', color: '#374151', label: 'Draft' },
  active: { bg: '#d1fae5', color: '#065f46', label: 'Active' },
  paused: { bg: '#fef3c7', color: '#92400e', label: 'Paused' },
  completed: { bg: '#dbeafe', color: '#1e40af', label: 'Completed' },
}

export default async function ABTestsPage() {
  const { supabase, organization, projects, currentProject } = await getPageContext()

  const experimentsQuery = supabase
    .from('experiments')
    .select('*')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })

  if (currentProject) {
    experimentsQuery.eq('project_id', currentProject.id)
  }

  const { data: experiments } = await experimentsQuery

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.xl }}>
            <div>
              <Heading level={1} serif>A/B Tests</Heading>
              <Text variant="muted" style={{ marginTop: theme.spacing.xs }}>
                Run experiments to find the best onboarding experience
              </Text>
            </div>
            <Button variant="primary" size="lg" href="/ab-tests/new">
              + New Test
            </Button>
          </div>

          {/* Tests List */}
          {experiments && experiments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {experiments.map((exp: Experiment) => {
                const status = STATUS_STYLES[exp.status] || STATUS_STYLES.draft
                const variants = exp.variants || []
                return (
                  <Card key={exp.id} padding="md" hover>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Link href={`/ab-tests/${exp.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                            <Heading level={3} serif>{exp.name}</Heading>
                            <span style={{
                              backgroundColor: status.bg,
                              color: status.color,
                              fontSize: theme.fontSizes.xs,
                              fontWeight: '600',
                              padding: '0.2rem 0.6rem',
                              borderRadius: theme.borderRadius.sm,
                            }}>
                              {status.label}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: theme.spacing.lg, marginTop: theme.spacing.sm }}>
                            <Text variant="muted" size="sm">
                              {variants.length} variant{variants.length !== 1 ? 's' : ''}
                            </Text>
                            <Text variant="muted" size="sm">
                              Primary metric: {exp.primary_metric.replace(/_/g, ' ')}
                            </Text>
                            <Text variant="light" size="sm">
                              Created {new Date(exp.created_at).toLocaleDateString()}
                            </Text>
                          </div>
                          {/* Variant breakdown */}
                          <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
                            {variants.map((v: any) => (
                              <span key={v.variant_id} style={{
                                fontSize: theme.fontSizes.xs,
                                color: theme.colors.textMuted,
                                backgroundColor: theme.colors.background,
                                padding: '0.2rem 0.5rem',
                                borderRadius: theme.borderRadius.sm,
                                border: `1px solid ${theme.colors.border}`,
                              }}>
                                {v.name} ({v.weight}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      </Link>
                      <ExperimentCardActions
                        experimentId={exp.id}
                        experimentName={exp.name}
                      />
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card padding="lg" style={{ textAlign: 'center', border: `2px dashed ${theme.colors.borderDashed}` }}>
              <div style={{ fontSize: '48px', marginBottom: theme.spacing.md }}>🧪</div>
              <Heading level={3} serif style={{ marginBottom: theme.spacing.sm }}>
                No A/B tests yet
              </Heading>
              <Text variant="muted" style={{ marginBottom: theme.spacing.lg }}>
                Create your first experiment to compare different onboarding flows
              </Text>
              <Button variant="primary" size="lg" href="/ab-tests/new">
                Create Your First Test
              </Button>
            </Card>
          )}
        </div>
      </Container>
    </Layout>
  )
}
