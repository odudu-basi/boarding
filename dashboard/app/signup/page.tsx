'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { theme } from '@/lib/theme'
import { Button, Heading, Text } from '@/components/ui'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Create the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      // Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationName,
          plan: 'free',
        })
        .select()
        .single()

      if (orgError) {
        setError('Failed to create organization: ' + orgError.message)
        setLoading(false)
        return
      }

      // Link user to organization
      const { error: userError } = await supabase.from('users').insert({
        auth_user_id: authData.user.id,
        organization_id: orgData.id,
        role: 'owner',
      })

      if (userError) {
        setError('Failed to link user: ' + userError.message)
        setLoading(false)
        return
      }

      router.push('/onboarding')
      router.refresh()
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme.colors.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
      }}
    >
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: theme.spacing.xl }}>
          <Heading level={1} serif style={{ marginBottom: theme.spacing.sm, color: theme.colors.primary }}>
            Noboarding
          </Heading>
          <Text variant="muted">Create your account</Text>
        </div>

        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            padding: theme.spacing.xl,
          }}
        >
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
            <div>
              <label
                htmlFor="organizationName"
                style={{
                  display: 'block',
                  fontSize: theme.fontSizes.sm,
                  fontWeight: '500',
                  color: theme.colors.text,
                  marginBottom: theme.spacing.sm,
                }}
              >
                Organization Name
              </label>
              <input
                id="organizationName"
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
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
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: theme.fontSizes.sm,
                  fontWeight: '500',
                  color: theme.colors.text,
                  marginBottom: theme.spacing.sm,
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: theme.fontSizes.sm,
                  fontWeight: '500',
                  color: theme.colors.text,
                  marginBottom: theme.spacing.sm,
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.fontSizes.base,
                  fontFamily: theme.fonts.sans,
                }}
                required
                minLength={6}
              />
              <Text variant="light" size="xs" style={{ marginTop: theme.spacing.xs }}>
                At least 6 characters
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

            <Button type="submit" variant="primary" size="lg" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          <div style={{ marginTop: theme.spacing.lg, textAlign: 'center' }}>
            <Text variant="muted" size="sm">
              Already have an account?{' '}
              <a
                href="/login"
                className="hover:underline"
                style={{ color: theme.colors.primary, fontWeight: '600', textDecoration: 'none' }}
              >
                Sign in
              </a>
            </Text>
          </div>
        </div>
      </div>
    </div>
  )
}
