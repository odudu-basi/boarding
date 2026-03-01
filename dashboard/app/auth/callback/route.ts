import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'

function generateApiKey(prefix: string) {
  return `${prefix}_${randomBytes(24).toString('hex')}`
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Use service role client to bypass RLS for checking/creating user data
      const adminSupabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: userData } = await adminSupabase
        .from('users')
        .select('organization_id')
        .eq('auth_user_id', user.id)
        .single()

      // Existing user with organization — go straight to dashboard
      if (userData?.organization_id) {
        return NextResponse.redirect(new URL('/home', request.url))
      }

      // New Google OAuth user — create organization and user row
      if (!userData) {
        const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'My Organization'

        const { data: orgData } = await adminSupabase
          .from('organizations')
          .insert({
            name: `${displayName}'s Organization`,
            plan: 'free',
            credits: 5,
            test_api_key: generateApiKey('nbd_test'),
            production_api_key: generateApiKey('nbd_live'),
          })
          .select()
          .single()

        if (orgData) {
          await adminSupabase.from('users').insert({
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
