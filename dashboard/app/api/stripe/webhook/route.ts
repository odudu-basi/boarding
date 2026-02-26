import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICE_TO_PLAN } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Admin client bypasses RLS — webhook has no user session
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          await handleSubscriptionChange(supabase, subscription)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(supabase, subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCanceled(supabase, subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        // Only add credits on recurring payments (not the first invoice)
        if (invoice.billing_reason === 'subscription_cycle') {
          await handleRecurringPayment(supabase, invoice)
        }
        break
      }
    }
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleSubscriptionChange(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const organizationId = subscription.metadata.organization_id
  if (!organizationId) {
    console.error('No organization_id in subscription metadata')
    return
  }

  const priceId = subscription.items.data[0]?.price.id
  const planInfo = PRICE_TO_PLAN[priceId]

  if (!planInfo) {
    console.error('Unknown price ID:', priceId)
    return
  }

  // Update organization plan and subscription info
  await supabase
    .from('organizations')
    .update({
      plan: planInfo.plan,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      subscription_status: subscription.status,
    })
    .eq('id', organizationId)

  // Add initial credits when subscription becomes active
  if (subscription.status === 'active') {
    const userId = subscription.metadata.user_id
    if (userId) {
      await supabase.rpc('add_user_credits', {
        p_user_id: userId,
        p_credits_amount: planInfo.credits,
        p_price_paid: planInfo.price,
        p_payment_provider: 'stripe',
        p_payment_id: subscription.id,
      })
    }
  }
}

async function handleSubscriptionCanceled(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const organizationId = subscription.metadata.organization_id
  if (!organizationId) return

  // Revert to free plan — existing credits remain (no clawback)
  await supabase
    .from('organizations')
    .update({
      plan: 'free',
      subscription_status: 'canceled',
      stripe_subscription_id: null,
      stripe_price_id: null,
    })
    .eq('id', organizationId)
}

async function handleRecurringPayment(
  supabase: any,
  invoice: Stripe.Invoice
) {
  if (!(invoice as any).subscription) return

  const subscription = await stripe.subscriptions.retrieve(
    (invoice as any).subscription as string
  )

  const organizationId = subscription.metadata.organization_id
  const userId = subscription.metadata.user_id
  if (!organizationId || !userId) return

  const priceId = subscription.items.data[0]?.price.id
  const planInfo = PRICE_TO_PLAN[priceId]
  if (!planInfo) return

  // Add monthly renewal credits
  await supabase.rpc('add_user_credits', {
    p_user_id: userId,
    p_credits_amount: planInfo.credits,
    p_price_paid: planInfo.price,
    p_payment_provider: 'stripe',
    p_payment_id: invoice.id,
  })
}
