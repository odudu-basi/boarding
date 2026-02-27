'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { theme } from '@/lib/theme'
import { Button, Heading, Text } from '@/components/ui'
import { CopyButton } from '@/components/CopyButton'

interface OnboardingWizardProps {
  organizationId: string
  organizationName: string
  mode?: 'full' | 'new-project'
}

const FULL_STEPS = [
  'Organization',
  'Project',
  'Team',
  'Referral',
  'Get Started',
]

const NEW_PROJECT_STEPS = [
  'Project',
  'Get Started',
]

const COMPANY_SIZES = [
  { value: 'solo', label: 'Solo' },
  { value: '2-10', label: '2-10' },
  { value: '11-50', label: '11-50' },
  { value: '50+', label: '50+' },
]

const ROLES = [
  { value: 'developer', label: 'Developer' },
  { value: 'product_manager', label: 'Product Manager' },
  { value: 'founder', label: 'Founder' },
  { value: 'other', label: 'Other' },
]

const PLATFORMS = [
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
  { value: 'cross_platform', label: 'Cross-platform' },
]

const REFERRAL_SOURCES = [
  { value: 'reddit', label: 'Reddit' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'hackernews', label: 'Hacker News' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'friend', label: 'Friend' },
  { value: 'coworker', label: 'Coworker' },
  { value: 'other', label: 'Other' },
]

export function OnboardingWizard({ organizationId, organizationName, mode = 'full' }: OnboardingWizardProps) {
  const router = useRouter()
  const supabase = createClient()
  const isNewProject = mode === 'new-project'
  const STEPS = isNewProject ? NEW_PROJECT_STEPS : FULL_STEPS

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Organization (full mode only)
  const [orgName, setOrgName] = useState(organizationName)
  const [companySize, setCompanySize] = useState('')
  const [userRole, setUserRole] = useState('')

  // Project
  const [appName, setAppName] = useState('')
  const [platform, setPlatform] = useState('cross_platform')
  const [bundleId, setBundleId] = useState('')
  const [createdProject, setCreatedProject] = useState<any>(null)

  // Team (full mode only)
  const [teamEmail, setTeamEmail] = useState('')
  const [teamEmails, setTeamEmails] = useState<string[]>([])

  // Referral (full mode only)
  const [referralSource, setReferralSource] = useState('')

  // Map step index to step name for easier logic
  const currentStepName = STEPS[step]

  const handleNext = async () => {
    setError('')
    setLoading(true)

    try {
      if (currentStepName === 'Organization') {
        // Save organization details
        if (!orgName.trim()) {
          setError('Organization name is required')
          setLoading(false)
          return
        }
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            name: orgName.trim(),
            company_size: companySize || null,
            user_role: userRole || null,
          })
          .eq('id', organizationId)

        if (updateError) {
          setError('Failed to update organization: ' + updateError.message)
          setLoading(false)
          return
        }
        setStep(step + 1)
      } else if (currentStepName === 'Project') {
        // Create project
        if (!appName.trim()) {
          setError('App name is required')
          setLoading(false)
          return
        }
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert({
            organization_id: organizationId,
            name: appName.trim(),
            platform,
            bundle_id: bundleId.trim() || null,
          })
          .select()
          .single()

        if (projectError) {
          setError('Failed to create project: ' + projectError.message)
          setLoading(false)
          return
        }
        setCreatedProject(project)
        setStep(step + 1)
      } else if (currentStepName === 'Team') {
        // Team step — just move on (emails collected for future use)
        setStep(step + 1)
      } else if (currentStepName === 'Referral') {
        // Save referral source
        if (referralSource) {
          await supabase
            .from('organizations')
            .update({ referral_source: referralSource })
            .eq('id', organizationId)
        }
        setStep(step + 1)
      } else if (currentStepName === 'Get Started') {
        // Complete — set selected project cookie and go to dashboard
        if (!isNewProject) {
          const { error: completeError } = await supabase
            .from('organizations')
            .update({ onboarding_completed: true })
            .eq('id', organizationId)

          if (completeError) {
            setError('Failed to complete setup: ' + completeError.message)
            setLoading(false)
            return
          }
        }

        // Set selected project cookie
        if (createdProject) {
          document.cookie = `selected_project=${createdProject.id}; path=/; max-age=${60 * 60 * 24 * 365}`
        }

        router.push('/home')
        router.refresh()
        return
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    }

    setLoading(false)
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
    setError('')
  }

  const handleSkip = () => {
    setError('')
    if (currentStepName === 'Team') setStep(step + 1)
    else if (currentStepName === 'Referral') setStep(step + 1)
  }

  const addTeamEmail = () => {
    const email = teamEmail.trim().toLowerCase()
    if (email && email.includes('@') && !teamEmails.includes(email)) {
      setTeamEmails([...teamEmails, email])
      setTeamEmail('')
    }
  }

  const removeTeamEmail = (email: string) => {
    setTeamEmails(teamEmails.filter(e => e !== email))
  }

  // Shared styles
  const radioGroupStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: theme.spacing.sm,
  }

  const radioOptionStyle = (selected: boolean): React.CSSProperties => ({
    padding: `${theme.spacing.md} ${theme.spacing.md}`,
    borderRadius: theme.borderRadius.md,
    border: `2px solid ${selected ? theme.colors.primary : theme.colors.border}`,
    backgroundColor: selected ? theme.colors.primaryTintStrong : theme.colors.surface,
    cursor: 'pointer',
    textAlign: 'center',
    fontFamily: theme.fonts.sans,
    fontSize: theme.fontSizes.sm,
    fontWeight: selected ? '600' : '400',
    color: selected ? theme.colors.primary : theme.colors.text,
    transition: 'all 0.15s',
  })

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.sans,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: theme.fontSizes.sm,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.colors.background,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: `${theme.spacing.xl} ${theme.spacing.md}`,
      fontFamily: theme.fonts.sans,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: theme.spacing.xl, textAlign: 'center' }}>
        <Heading level={2} serif style={{ color: theme.colors.primary, fontStyle: 'italic' }}>
          Noboarding
        </Heading>
      </div>

      {/* Progress Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.xl,
        maxWidth: 400,
        width: '100%',
      }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              height: 4,
              width: '100%',
              borderRadius: 2,
              backgroundColor: i <= step ? theme.colors.primary : theme.colors.border,
              transition: 'background-color 0.3s',
            }} />
            <span style={{
              fontSize: '10px',
              color: i <= step ? theme.colors.primary : theme.colors.textMuted,
              fontWeight: i === step ? '600' : '400',
            }}>
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        padding: theme.spacing.xl,
        maxWidth: 520,
        width: '100%',
      }}>
        {/* ── Step: Organization ── */}
        {currentStepName === 'Organization' && (
          <>
            <Heading level={3} serif style={{ marginBottom: theme.spacing.xs }}>
              Tell us about your organization
            </Heading>
            <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.lg }}>
              We'll use this to personalize your experience.
            </Text>

            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
              <div>
                <label style={labelStyle}>Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Company Size</label>
                <div style={radioGroupStyle}>
                  {COMPANY_SIZES.map(s => (
                    <div
                      key={s.value}
                      style={radioOptionStyle(companySize === s.value)}
                      onClick={() => setCompanySize(s.value)}
                    >
                      {s.label}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Your Role</label>
                <div style={radioGroupStyle}>
                  {ROLES.map(r => (
                    <div
                      key={r.value}
                      style={radioOptionStyle(userRole === r.value)}
                      onClick={() => setUserRole(r.value)}
                    >
                      {r.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Step: Project ── */}
        {currentStepName === 'Project' && (
          <>
            <Heading level={3} serif style={{ marginBottom: theme.spacing.xs }}>
              {isNewProject ? 'Create a new project' : 'Create your first project'}
            </Heading>
            <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.lg }}>
              A project represents one app. You can create more later.
            </Text>

            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
              <div>
                <label style={labelStyle}>App Name</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="My Awesome App"
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Platform</label>
                <div style={radioGroupStyle}>
                  {PLATFORMS.map(p => (
                    <div
                      key={p.value}
                      style={radioOptionStyle(platform === p.value)}
                      onClick={() => setPlatform(p.value)}
                    >
                      {p.label}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  Bundle ID <span style={{ color: theme.colors.textMuted, fontWeight: '400' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={bundleId}
                  onChange={(e) => setBundleId(e.target.value)}
                  placeholder="com.company.appname"
                  style={inputStyle}
                />
              </div>
            </div>
          </>
        )}

        {/* ── Step: Team ── */}
        {currentStepName === 'Team' && (
          <>
            <Heading level={3} serif style={{ marginBottom: theme.spacing.xs }}>
              Invite your team
            </Heading>
            <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.lg }}>
              Add teammates to collaborate. You can always do this later.
            </Text>

            <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
              <input
                type="email"
                value={teamEmail}
                onChange={(e) => setTeamEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTeamEmail() } }}
                placeholder="teammate@company.com"
                style={{ ...inputStyle, flex: 1 }}
              />
              <Button
                variant="secondary"
                onClick={addTeamEmail}
                style={{ whiteSpace: 'nowrap' }}
              >
                Add
              </Button>
            </div>

            {teamEmails.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
                {teamEmails.map(email => (
                  <div
                    key={email}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      backgroundColor: theme.colors.background,
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.fontSizes.sm,
                    }}
                  >
                    <span>{email}</span>
                    <span
                      style={{ cursor: 'pointer', color: theme.colors.textMuted, fontSize: theme.fontSizes.lg }}
                      onClick={() => removeTeamEmail(email)}
                    >
                      &times;
                    </span>
                  </div>
                ))}
              </div>
            )}

            {teamEmails.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: theme.spacing.xl,
                color: theme.colors.textMuted,
                fontSize: theme.fontSizes.sm,
              }}>
                No teammates added yet
              </div>
            )}
          </>
        )}

        {/* ── Step: Referral ── */}
        {currentStepName === 'Referral' && (
          <>
            <Heading level={3} serif style={{ marginBottom: theme.spacing.xs }}>
              How did you hear about us?
            </Heading>
            <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.lg }}>
              This helps us understand where our community comes from.
            </Text>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: theme.spacing.sm,
            }}>
              {REFERRAL_SOURCES.map(source => (
                <div
                  key={source.value}
                  style={radioOptionStyle(referralSource === source.value)}
                  onClick={() => setReferralSource(source.value)}
                >
                  {source.label}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Step: All Set ── */}
        {currentStepName === 'Get Started' && createdProject && (
          <>
            <Heading level={3} serif style={{ marginBottom: theme.spacing.xs }}>
              You're all set!
            </Heading>
            <Text variant="muted" size="sm" style={{ marginBottom: theme.spacing.lg }}>
              Here are your API keys for <strong>{createdProject.name}</strong>. You'll need these to integrate the SDK.
            </Text>

            {/* Test API Key */}
            <div style={{ marginBottom: theme.spacing.md }}>
              <Text size="sm" style={{ fontWeight: '500', marginBottom: theme.spacing.xs, display: 'block' }}>
                Test API Key
              </Text>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
              }}>
                <code style={{
                  flex: 1,
                  backgroundColor: theme.colors.background,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  borderRadius: theme.borderRadius.md,
                  fontFamily: theme.fonts.mono,
                  fontSize: theme.fontSizes.xs,
                  color: theme.colors.text,
                  overflowX: 'auto',
                }}>
                  {createdProject.test_api_key}
                </code>
                <CopyButton text={createdProject.test_api_key} />
              </div>
            </div>

            {/* Production API Key */}
            <div style={{ marginBottom: theme.spacing.lg }}>
              <Text size="sm" style={{ fontWeight: '500', marginBottom: theme.spacing.xs, display: 'block' }}>
                Production API Key
              </Text>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
              }}>
                <code style={{
                  flex: 1,
                  backgroundColor: theme.colors.background,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  borderRadius: theme.borderRadius.md,
                  fontFamily: theme.fonts.mono,
                  fontSize: theme.fontSizes.xs,
                  color: theme.colors.text,
                  overflowX: 'auto',
                }}>
                  {createdProject.production_api_key}
                </code>
                <CopyButton text={createdProject.production_api_key} />
              </div>
            </div>

            <div style={{
              backgroundColor: theme.colors.background,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.lg,
            }}>
              <Text size="sm" style={{ fontWeight: '600', marginBottom: theme.spacing.sm, display: 'block' }}>
                Next steps
              </Text>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <span style={{ color: theme.colors.primary }}>1.</span>
                  <Text size="sm">Install the SDK in your React Native app</Text>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <span style={{ color: theme.colors.primary }}>2.</span>
                  <Text size="sm">Create your first onboarding flow</Text>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <span style={{ color: theme.colors.primary }}>3.</span>
                  <Text size="sm">Check the docs for the AI setup guide</Text>
                </li>
              </ul>
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: theme.colors.error,
            border: `1px solid ${theme.colors.errorText}`,
            color: theme.colors.errorText,
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.fontSizes.sm,
            marginTop: theme.spacing.md,
          }}>
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: theme.spacing.xl,
          gap: theme.spacing.sm,
        }}>
          <div>
            {step > 0 && currentStepName !== 'Get Started' && (
              <Button variant="ghost" onClick={handleBack} disabled={loading}>
                Back
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            {(currentStepName === 'Team' || currentStepName === 'Referral') && (
              <Button variant="ghost" onClick={handleSkip} disabled={loading}>
                Skip
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : currentStepName === 'Get Started'
                  ? 'Go to Dashboard'
                  : 'Continue'
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
