import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from './OnboardingWizard'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const supabase = await createClient()
  const { mode } = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userOrgs } = await supabase
    .from('users')
    .select('organization_id, organizations(*)')
    .eq('auth_user_id', user.id)
    .single()

  if (!userOrgs?.organizations) redirect('/login')
  const organization = userOrgs.organizations as any

  // If onboarding is already complete, redirect — unless creating a new project
  if (organization.onboarding_completed && mode !== 'new-project') redirect('/')

  return (
    <OnboardingWizard
      organizationId={organization.id}
      organizationName={organization.name}
      mode={mode === 'new-project' ? 'new-project' : 'full'}
    />
  )
}
