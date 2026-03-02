import { getPageContext } from '@/lib/get-page-context'
import { Layout } from '@/components/Layout'
import { SupportContent } from './SupportContent'

export default async function SupportPage() {
  const { user, organization, projects, currentProject } = await getPageContext()

  return (
    <Layout
      organizationName={organization.name}
      plan={organization.plan}
      projects={projects.map(p => ({ id: p.id, name: p.name, platform: p.platform }))}
      currentProjectId={currentProject?.id}
    >
      <SupportContent userEmail={user.email!} />
    </Layout>
  )
}
