'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { theme } from '@/lib/theme'
import { Button, Card, Container, Heading, Text } from '@/components/ui'
import { Layout } from '@/components/Layout'

export default function NewFlowPage() {
  const [name, setName] = useState('')
  const [version, setVersion] = useState('1.0.0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Get user's organization
    const { data: userOrgs } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!userOrgs) {
      setError('No organization found')
      setLoading(false)
      return
    }

    // Read selected project from cookie
    const projectCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('selected_project='))
      ?.split('=')[1]

    // Create the config (defaults to test environment)
    const { data, error: insertError } = await supabase
      .from('onboarding_configs')
      .insert({
        organization_id: userOrgs.organization_id,
        project_id: projectCookie || null,
        name,
        version,
        config: {
          version,
          screens: [],
        },
        is_published: false,
        environment: 'test', // Default to test environment for new flows
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Redirect to the flow builder
    router.push(`/flows/${data.id}`)
  }

  return (
    <Layout>
      <Container>
        <div style={{ paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.xl }}>
          <div style={{ marginBottom: theme.spacing.xl }}>
            <Heading level={1} serif>
              Create New Flow
            </Heading>
            <Text variant="muted" style={{ marginTop: theme.spacing.xs }}>
              Set up a new onboarding experience for your app
            </Text>
          </div>

          <div style={{ maxWidth: '600px' }}>
            <Card padding="lg">
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
                <div>
                  <label
                    htmlFor="name"
                    style={{
                      display: 'block',
                      fontSize: theme.fontSizes.sm,
                      fontWeight: '500',
                      color: theme.colors.text,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    Flow Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., iOS Onboarding, Android Tutorial"
                    style={{
                      width: '100%',
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.fontSizes.base,
                      fontFamily: theme.fonts.sans,
                    }}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="version"
                    style={{
                      display: 'block',
                      fontSize: theme.fontSizes.sm,
                      fontWeight: '500',
                      color: theme.colors.text,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    Version
                  </label>
                  <input
                    id="version"
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.0.0"
                    style={{
                      width: '100%',
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.fontSizes.base,
                      fontFamily: theme.fonts.sans,
                    }}
                    required
                  />
                  <Text variant="light" size="xs" style={{ marginTop: theme.spacing.xs }}>
                    Use semantic versioning (e.g., 1.0.0, 2.1.3)
                  </Text>
                </div>

                {error && (
                  <div
                    style={{
                      backgroundColor: theme.colors.error,
                      border: `1px solid ${theme.colors.errorText}`,
                      color: theme.colors.errorText,
                      padding: theme.spacing.md,
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.fontSizes.sm,
                    }}
                  >
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
                  <Button type="button" variant="secondary" onClick={() => router.push('/')}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Flow'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </Container>
    </Layout>
  )
}
