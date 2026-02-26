import { getPageContext } from '@/lib/get-page-context'
import { DocsContent } from './DocsContent'

export interface CustomScreenInfo {
  flowName: string
  screenId: string
  componentName: string
  description: string
  variables: string[]
}

export default async function DocsPage() {
  const { supabase, organization, currentProject } = await getPageContext()

  // Use project API keys if available, fall back to org
  const testApiKey = currentProject?.test_api_key || organization.test_api_key || ''
  const productionApiKey = currentProject?.production_api_key || organization.production_api_key || ''

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

  const customScreens: CustomScreenInfo[] = []

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

  return (
    <DocsContent
      testApiKey={testApiKey}
      productionApiKey={productionApiKey}
      customScreens={customScreens}
    />
  )
}
