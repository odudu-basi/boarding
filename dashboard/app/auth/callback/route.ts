import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirect') || '/home'

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      // If code exchange fails, send to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Use service role client to bypass RLS for checking/creating user data
      const adminSupabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: userData } = await adminSupabase
        .from('users')
        .select('organization_id, organizations(onboarding_completed)')
        .eq('auth_user_id', user.id)
        .single()

      // Existing user with organization
      if (userData?.organization_id) {
        const org = userData.organizations as any
        // If onboarding is done, always go to dashboard
        if (org?.onboarding_completed) {
          return NextResponse.redirect(new URL('/home', request.url))
        }
        // Onboarding not finished — send them back to complete it
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }

      // New Google OAuth user — create organization and user row
      if (!userData) {
        const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'My Organization'

        const { data: orgData, error: orgError } = await adminSupabase
          .from('organizations')
          .insert({
            name: `${displayName}'s Organization`,
            plan: 'free',
            credits: 5,
          })
          .select()
          .single()

        if (orgData) {
          await adminSupabase.from('users').insert({
            auth_user_id: user.id,
            organization_id: orgData.id,
            role: 'owner',
          })
          // New user — go to onboarding
          return NextResponse.redirect(new URL('/onboarding', request.url))
        }

        // If org creation failed, log and redirect to login
        console.error('Failed to create organization:', orgError?.message)
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }

  // Fallback — no code or no user
  return NextResponse.redirect(new URL('/login', request.url))
}
