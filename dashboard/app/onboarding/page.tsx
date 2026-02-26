import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from './OnboardingWizard'

export default async function OnboardingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userOrgs } = await supabase
    .from('users')
    .select('organization_id, organizations(*)')
    .eq('auth_user_id', user.id)
    .single()

  if (!userOrgs?.organizations) redirect('/login')
  const organization = userOrgs.organizations as any

  // If onboarding is already complete, go to dashboard
  if (organization.onboarding_completed) redirect('/')

  return (
    <OnboardingWizard
      organizationId={organization.id}
      organizationName={organization.name}
    />
  )
}
