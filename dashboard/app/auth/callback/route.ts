import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/onboarding'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Check if user already has an organization
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('auth_user_id', user.id)
        .single()

      // If user already has an organization, redirect to /home instead of /onboarding
      if (userData?.organization_id) {
        return NextResponse.redirect(new URL('/home', request.url))
      }
    }
  }

  // For new users (no organization), redirect to onboarding to collect org name
  return NextResponse.redirect(new URL(redirect, request.url))
}
