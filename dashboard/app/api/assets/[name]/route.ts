import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch the flow's config to get assets
    // Assets are stored in onboarding_configs.config.assets
    const { data: configs } = await supabase
      .from('onboarding_configs')
      .select('config')
      .eq('organization_id', userData.organization_id)

    if (!configs || configs.length === 0) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    // Search through all configs to find the asset by name
    for (const configRow of configs) {
      const assets = configRow.config?.assets || []
      const asset = assets.find((a: any) => a.name === name)

      if (asset) {
        return NextResponse.json({
          name: asset.name,
          type: asset.type,
          data: asset.data,  // base64 data URL
        })
      }
    }

    return NextResponse.json(
      { error: 'Asset not found' },
      { status: 404 }
    )

  } catch (error: any) {
    console.error('Asset fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch asset' },
      { status: 500 }
    )
  }
}
