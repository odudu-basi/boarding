'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function renameFlow(id: string, name: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('onboarding_configs')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { error: null }
}

export async function deleteFlow(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('onboarding_configs')
    .delete()
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { error: null }
}

export async function publishFlow(id: string, environment: 'test' | 'production') {
  const supabase = await createClient()

  // Get the flow to find its organization and project
  const { data: flow, error: fetchError } = await supabase
    .from('onboarding_configs')
    .select('organization_id, project_id')
    .eq('id', id)
    .single()

  if (fetchError || !flow) return { error: fetchError?.message || 'Flow not found' }

  // Unpublish all other flows in the same project (or org) AND environment
  let unpublishQuery = supabase
    .from('onboarding_configs')
    .update({ is_published: false, updated_at: new Date().toISOString() })
    .eq('organization_id', flow.organization_id)
    .eq('environment', environment)
    .neq('id', id)
    .eq('is_published', true)

  if (flow.project_id) {
    unpublishQuery = unpublishQuery.eq('project_id', flow.project_id)
  }

  const { error: unpublishError } = await unpublishQuery

  if (unpublishError) return { error: unpublishError.message }

  // Publish this flow
  const { error } = await supabase
    .from('onboarding_configs')
    .update({ is_published: true, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/')
  return { error: null }
}

export async function duplicateFlow(id: string, newName: string) {
  const supabase = await createClient()

  // Fetch the original config
  const { data: original, error: fetchError } = await supabase
    .from('onboarding_configs')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !original) return { error: fetchError?.message || 'Flow not found' }

  // Insert the duplicate (preserving project_id)
  const { error } = await supabase
    .from('onboarding_configs')
    .insert({
      organization_id: original.organization_id,
      project_id: original.project_id || null,
      name: newName,
      version: original.version,
      is_published: false,
      config: original.config,
      environment: original.environment || 'test',
    })

  if (error) return { error: error.message }
  revalidatePath('/')
  return { error: null }
}

export async function switchProject(projectId: string) {
  const cookieStore = await cookies()
  cookieStore.set('selected_project', projectId, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  revalidatePath('/')
}
