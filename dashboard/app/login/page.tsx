'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { theme } from '@/lib/theme'
import { Button, Heading, Text } from '@/components/ui'
import { trackLoginCompleted, identifyUser } from '@/lib/mixpanel'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/home'
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.user) {
      // Track login and identify user
      trackLoginCompleted(email)

      // Fetch user's organization for identification
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id, organizations(*)')
        .eq('auth_user_id', data.user.id)
        .single()

      if (userData?.organizations) {
        const org = userData.organizations as any
        identifyUser(data.user.id, {
          email,
          organization_id: org.id,
          organization_name: org.name,
          plan: org.plan,
        })
      }

      router.push(redirectTo)
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
          <Text variant="muted">Sign in to your dashboard</Text>
        </div>

        <div
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            padding: theme.spacing.xl,
          }}
        >
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
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
              />
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
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div style={{ marginTop: theme.spacing.lg, textAlign: 'center' }}>
            <Text variant="muted" size="sm">
              Don't have an account?{' '}
              <a
                href="/signup"
                className="hover:underline"
                style={{ color: theme.colors.primary, fontWeight: '600', textDecoration: 'none' }}
              >
                Sign up
              </a>
            </Text>
          </div>
        </div>

        <div style={{ marginTop: theme.spacing.xl, textAlign: 'center' }}>
          <Text variant="light" size="sm">
            Demo credentials for testing:
          </Text>
          <Text variant="light" size="xs" style={{ fontFamily: theme.fonts.mono, marginTop: theme.spacing.xs }}>
            test@noboarding.com / demo123
          </Text>
        </div>
      </div>
    </div>
  )
}
