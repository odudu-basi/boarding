import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Project } from '@/lib/types'

export async function getPageContext() {
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

  // Gate: redirect to onboarding if not completed
  if (!organization.onboarding_completed) redirect('/onboarding')

  // Fetch projects for this org
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: true })

  // Determine current project from cookie
  const cookieStore = await cookies()
  const selectedProjectId = cookieStore.get('selected_project')?.value
  const allProjects = (projects || []) as Project[]
  const currentProject = allProjects.find(p => p.id === selectedProjectId) || allProjects[0] || null

  return { supabase, user, organization, projects: allProjects, currentProject }
}
