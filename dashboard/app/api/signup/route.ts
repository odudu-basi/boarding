import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { authUserId, organizationName } = await request.json()

    if (!authUserId || !organizationName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create organization with 5 free credits
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organizationName,
        plan: 'free',
        credits: 5,
      })
      .select()
      .single()

    if (orgError) {
      return NextResponse.json({ error: 'Failed to create organization: ' + orgError.message }, { status: 500 })
    }

    // Link user to organization
    const { error: userError } = await supabase.from('users').insert({
      auth_user_id: authUserId,
      organization_id: orgData.id,
      role: 'owner',
    })

    if (userError) {
      return NextResponse.json({ error: 'Failed to link user: ' + userError.message }, { status: 500 })
    }

    return NextResponse.json({ organizationId: orgData.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
