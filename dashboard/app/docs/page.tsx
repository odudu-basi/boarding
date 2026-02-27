import { createClient } from '@/lib/supabase/server'
import { DocsContent } from './DocsContent'

export interface CustomScreenInfo {
  flowName: string
  screenId: string
  componentName: string
  description: string
  variables: string[]
}

export default async function DocsPage() {
  const supabase = await createClient()

  // Check if user is authenticated (but don't require it)
  const { data: { user } } = await supabase.auth.getUser()

  let testApiKey = 'nb_test_your_test_key_here'
  let productionApiKey = 'nb_live_your_production_key_here'
  const customScreens: CustomScreenInfo[] = []

  // Only fetch real data if user is authenticated
  if (user) {
    const { data: userOrgs } = await supabase
      .from('users')
      .select('organization_id, organizations(*)')
      .eq('auth_user_id', user.id)
      .single()

    if (userOrgs?.organizations) {
      const organization = userOrgs.organizations as any

      // Fetch projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: true })

      const currentProject = (projects && projects.length > 0) ? projects[0] : null

      // Use real API keys if authenticated
      testApiKey = currentProject?.test_api_key || organization.test_api_key || testApiKey
      productionApiKey = currentProject?.production_api_key || organization.production_api_key || productionApiKey

      // Fetch all onboarding configs to extract custom screens
      const configsQuery = supabase
        .from('onboarding_configs')
        .select('id, name, config')
        .eq('organization_id', organization.id)
        .order('updated_at', { ascending: false })

      if (currentProject) {
        configsQuery.eq('project_id', currentProject.id)
      }

      const { data: configs } = await configsQuery

      if (configs) {
        for (const cfg of configs) {
          const screens = cfg.config?.screens || []
          for (const screen of screens) {
            if (screen.type === 'custom_screen' && screen.custom_component_name) {
              customScreens.push({
                flowName: cfg.name || 'Untitled Flow',
                screenId: screen.id,
                componentName: screen.custom_component_name,
                description: screen.custom_description || '',
                variables: screen.custom_variables || [],
              })
            }
          }
        }
      }
    }
  }

  return (
    <DocsContent
      testApiKey={testApiKey}
      productionApiKey={productionApiKey}
      customScreens={customScreens}
      isAuthenticated={!!user}
    />
  )
}
