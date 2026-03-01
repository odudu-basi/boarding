import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/home'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Check if user has an organization
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('auth_user_id', user.id)
        .single()

      // If no organization exists, create one (for new Google OAuth signups)
      if (!userData) {
        // Create a default organization name from email
        const orgName = user.email?.split('@')[0] || 'My Organization'

        const { data: orgData } = await supabase
          .from('organizations')
          .insert({
            name: orgName,
            plan: 'free',
            credits: 5,
          })
          .select()
          .single()

        if (orgData) {
          // Link user to organization
          await supabase.from('users').insert({
            auth_user_id: user.id,
            organization_id: orgData.id,
            role: 'owner',
          })
        }
      }
    }
  }

  // Redirect to the specified page
  return NextResponse.redirect(new URL(redirect, request.url))
}
