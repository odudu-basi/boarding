import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('auth_user_id', user.id)
        .single()

      // Existing user with organization — go straight to dashboard
      if (userData?.organization_id) {
        return NextResponse.redirect(new URL('/home', request.url))
      }

      // New Google OAuth user — no users row exists yet
      // Create organization and user row so they don't get stuck in a redirect loop
      if (!userData) {
        const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'My Organization'

        // Create organization with 5 free credits
        const { data: orgData } = await supabase
          .from('organizations')
          .insert({
            name: `${displayName}'s Organization`,
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

  // Redirect to onboarding to complete setup (project creation, etc.)
  return NextResponse.redirect(new URL('/onboarding', request.url))
}
