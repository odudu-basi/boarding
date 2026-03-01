'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { theme } from '@/lib/theme'
import { Text } from '@/components/ui'
import { trackSignupStarted, trackSignupCompleted, identifyUser } from '@/lib/mixpanel'
import Image from 'next/image'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Track when user lands on signup page
  useEffect(() => {
    trackSignupStarted(document.referrer)
  }, [])

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/onboarding`,
      },
    })
    if (error) {
      setError(error.message)
    }
  }

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
      // Create organization with 5 free credits
      const { data: orgData, error: orgError} = await supabase
        .from('organizations')
        .insert({
          name: organizationName,
          plan: 'free',
          credits: 5,
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

      // Track signup completion and identify user
      trackSignupCompleted(email, organizationName)
      identifyUser(authData.user.id, {
        email,
        organization_id: orgData.id,
        organization_name: organizationName,
        plan: 'free',
        signup_date: new Date().toISOString(),
      })

      router.push('/onboarding')
      router.refresh()
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.colors.background }}>
      {/* Left Side - Robot Image */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(242, 101, 34, 0.08) 0%, rgba(242, 101, 34, 0.03) 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', width: '50%', maxWidth: '400px', aspectRatio: '1' }}>
          <Image
            src="/favicon.png"
            alt="Noboarding"
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
      </div>

      {/* Right Side - Form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing['2xl'],
          backgroundColor: theme.colors.surface,
        }}
      >
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Header */}
          <div style={{ marginBottom: theme.spacing['2xl'] }}>
            <h1
              style={{
                fontSize: theme.fontSizes['4xl'],
                fontWeight: '600',
                color: theme.colors.text,
                marginBottom: theme.spacing.xs,
                fontFamily: theme.fonts.sans,
              }}
            >
              Create your account
            </h1>
            <p style={{ fontSize: theme.fontSizes.base, color: theme.colors.textMuted, fontFamily: theme.fonts.sans }}>
              Start building onboarding flows today
            </p>
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleSignup}
            type="button"
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              color: theme.colors.text,
              fontSize: theme.fontSizes.sm,
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
              fontFamily: theme.fonts.sans,
              transition: 'border-color 0.2s, background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.background
              e.currentTarget.style.borderColor = theme.colors.borderDashed
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surface
              e.currentTarget.style.borderColor = theme.colors.border
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.55 0 9s.348 2.827.957 4.042l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: `${theme.spacing.lg} 0`,
              color: theme.colors.textMuted,
              fontSize: theme.fontSizes.xs,
              fontFamily: theme.fonts.sans,
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: theme.colors.border }} />
            <span style={{ padding: `0 ${theme.spacing.md}` }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: theme.colors.border }} />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            {/* Organization Name */}
            <div>
              <label
                htmlFor="organizationName"
                style={{
                  display: 'block',
                  fontSize: theme.fontSizes.sm,
                  fontWeight: '500',
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs,
                  fontFamily: theme.fonts.sans,
                }}
              >
                Organization Name
              </label>
              <input
                id="organizationName"
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Acme Inc"
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.sans,
                  outline: 'none',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = theme.colors.primary)}
                onBlur={(e) => (e.currentTarget.style.borderColor = theme.colors.border)}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: theme.fontSizes.sm,
                  fontWeight: '500',
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs,
                  fontFamily: theme.fonts.sans,
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.sans,
                  outline: 'none',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = theme.colors.primary)}
                onBlur={(e) => (e.currentTarget.style.borderColor = theme.colors.border)}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: theme.fontSizes.sm,
                  fontWeight: '500',
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs,
                  fontFamily: theme.fonts.sans,
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  style={{
                    width: '100%',
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    paddingRight: theme.spacing['2xl'],
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.text,
                    fontFamily: theme.fonts.sans,
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = theme.colors.primary)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = theme.colors.border)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: theme.spacing.md,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: theme.colors.textMuted,
                    cursor: 'pointer',
                    padding: '4px',
                    fontSize: '16px',
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.error,
                  border: `1px solid ${theme.colors.errorText}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.errorText,
                  fontFamily: theme.fonts.sans,
                }}
              >
                {error}
              </div>
            )}

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                backgroundColor: theme.colors.primary,
                border: 'none',
                borderRadius: theme.borderRadius.md,
                color: '#fff',
                fontSize: theme.fontSizes.sm,
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: theme.fonts.sans,
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s, background-color 0.2s',
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = theme.colors.primaryHover)}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = theme.colors.primary)}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {/* Sign In Link */}
          <div style={{ marginTop: theme.spacing.lg, textAlign: 'center' }}>
            <Text variant="muted" size="sm">
              Already have an account?{' '}
              <a
                href="/login"
                style={{
                  color: theme.colors.primary,
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontFamily: theme.fonts.sans,
                }}
              >
                Sign in
              </a>
            </Text>
          </div>

          {/* Terms & Privacy */}
          <div style={{ marginTop: theme.spacing.xl, textAlign: 'center', fontSize: theme.fontSizes.xs, color: theme.colors.textLight, fontFamily: theme.fonts.sans }}>
            By continuing, you agree to Noboarding's{' '}
            <a href="/terms" style={{ color: theme.colors.textMuted, textDecoration: 'underline' }}>
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" style={{ color: theme.colors.textMuted, textDecoration: 'underline' }}>
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
