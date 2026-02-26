import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PRICE_TO_PLAN } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { priceId } = await request.json()

    if (!priceId || !PRICE_TO_PLAN[priceId]) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's organization
    const { data: userOrg } = await supabase
      .from('users')
      .select('organization_id, organizations(*)')
      .eq('auth_user_id', user.id)
      .single()

    if (!userOrg?.organizations) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const org = userOrg.organizations as any

    // Get or create Stripe customer for this organization
    let customerId = org.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: org.name,
        metadata: {
          organization_id: org.id,
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', org.id)
    }

    // Create Checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${request.nextUrl.origin}/settings?checkout=success`,
      cancel_url: `${request.nextUrl.origin}/pricing?checkout=canceled`,
      metadata: {
        organization_id: org.id,
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          organization_id: org.id,
          user_id: user.id,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
