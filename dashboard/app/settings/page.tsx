import { getPageContext } from '@/lib/get-page-context'
import { Layout } from '@/components/Layout'
import { Container, Card, Heading, Text, Button } from '@/components/ui'
import { theme } from '@/lib/theme'
import { ThemeSelector } from '@/components/ThemeSelector'
import { BillingSection } from '@/components/BillingSection'
import { CheckoutSuccessBanner } from '@/components/CheckoutSuccessBanner'
import { CopyButton } from '@/components/CopyButton'

export default async function SettingsPage() {
  const { supabase, user, organization, projects, currentProject } = await getPageContext()

  // Get user role
  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('auth_user_id', user.id)
    .eq('organization_id', organization.id)
    .single()

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
          {/* Header */}
          <div style={{ marginBottom: theme.spacing.xl }}>
            <Heading level={1} serif>
              Settings
            </Heading>
          </div>

          <CheckoutSuccessBanner />

          {/* Account Information */}
          <Card padding="md" style={{ marginBottom: theme.spacing.lg }}>
            <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
              Account Information
            </Heading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              <div>
                <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.xs }}>
                  Email
                </Text>
                <Text>{user.email}</Text>
              </div>
              <div>
                <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.xs }}>
                  Role
                </Text>
                <Text style={{ textTransform: 'capitalize' }}>{userRecord?.role || 'member'}</Text>
              </div>
            </div>
          </Card>

          {/* Appearance */}
          <Card padding="md" style={{ marginBottom: theme.spacing.lg }}>
            <Heading level={3} serif style={{ marginBottom: theme.spacing.sm }}>
              Appearance
            </Heading>
            <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.md }}>
              Choose your preferred theme
            </Text>
            <ThemeSelector />
          </Card>

          {/* Project Settings */}
          {currentProject && (
            <Card padding="md" style={{ marginBottom: theme.spacing.lg }}>
              <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
                Project — {currentProject.name}
              </Heading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                <div>
                  <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.xs }}>
                    Platform
                  </Text>
                  <Text style={{ textTransform: 'capitalize' }}>
                    {currentProject.platform === 'cross_platform' ? 'Cross-platform' : currentProject.platform === 'ios' ? 'iOS' : 'Android'}
                  </Text>
                </div>
                {currentProject.bundle_id && (
                  <div>
                    <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.xs }}>
                      Bundle ID
                    </Text>
                    <Text>{currentProject.bundle_id}</Text>
                  </div>
                )}
                <div>
                  <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.xs }}>
                    Test API Key
                  </Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <code style={{
                      flex: 1,
                      display: 'block',
                      backgroundColor: theme.colors.background,
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      borderRadius: theme.borderRadius.md,
                      fontFamily: theme.fonts.mono,
                      fontSize: theme.fontSizes.sm,
                      color: theme.colors.text,
                      overflowX: 'auto',
                    }}>
                      {testApiKey}
                    </code>
                    <CopyButton text={testApiKey} />
                  </div>
                  <Text variant="muted" size="xs" style={{ marginTop: theme.spacing.xs }}>
                    Use this key for development and testing
                  </Text>
                </div>
                <div>
                  <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.xs }}>
                    Production API Key
                  </Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <code style={{
                      flex: 1,
                      display: 'block',
                      backgroundColor: theme.colors.background,
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      borderRadius: theme.borderRadius.md,
                      fontFamily: theme.fonts.mono,
                      fontSize: theme.fontSizes.sm,
                      color: theme.colors.text,
                      overflowX: 'auto',
                    }}>
                      {productionApiKey}
                    </code>
                    <CopyButton text={productionApiKey} />
                  </div>
                  <Text variant="muted" size="xs" style={{ marginTop: theme.spacing.xs }}>
                    Use this key for production builds
                  </Text>
                </div>
              </div>
            </Card>
          )}

          {/* Organization */}
          <Card padding="md" style={{ marginBottom: theme.spacing.lg }}>
            <Heading level={3} serif style={{ marginBottom: theme.spacing.md }}>
              Organization
            </Heading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              <div>
                <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.xs }}>
                  Name
                </Text>
                <Text>{organization.name}</Text>
              </div>
              <div>
                <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.xs }}>
                  Plan
                </Text>
                <span
                  style={{
                    display: 'inline-block',
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    fontSize: theme.fontSizes.xs,
                    fontWeight: '600',
                    padding: '0.25rem 0.625rem',
                    borderRadius: theme.borderRadius.sm,
                    textTransform: 'capitalize',
                  }}
                >
                  {organization.plan}
                </span>
              </div>
            </div>
          </Card>

          {/* Billing */}
          <BillingSection
            plan={organization.plan}
            subscriptionStatus={organization.subscription_status}
            hasStripeCustomer={!!organization.stripe_customer_id}
          />

          {/* Danger Zone */}
          <Card
            padding="lg"
            style={{
              border: `1px solid ${theme.colors.errorText}`,
              backgroundColor: theme.colors.error,
            }}
          >
            <Heading level={3} style={{ marginBottom: theme.spacing.md, color: theme.colors.errorText }}>
              Danger Zone
            </Heading>
            <Text style={{ marginBottom: theme.spacing.md, color: theme.colors.errorText }}>
              Once you delete your organization, there is no going back. All flows and analytics will be permanently deleted.
            </Text>
            <Button variant="secondary">Delete Organization</Button>
          </Card>
        </div>
      </Container>
    </Layout>
  )
}
