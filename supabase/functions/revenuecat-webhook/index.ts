import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * RevenueCat Webhook Handler
 *
 * Receives webhook events from RevenueCat and stores them in the database.
 * This enables tracking paywall conversions and attributing them to onboarding sessions.
 *
 * Setup in RevenueCat:
 * 1. Go to RevenueCat Dashboard → Integrations → Webhooks
 * 2. Add webhook URL: https://your-project.supabase.co/functions/v1/revenuecat-webhook
 * 3. Add Authorization header with your webhook secret
 * 4. Select events to send (at minimum: INITIAL_PURCHASE, RENEWAL)
 *
 * @see https://www.revenuecat.com/docs/webhooks
 */

interface RevenueCatEvent {
  api_version: string;
  event: {
    id: string;
    type: string; // INITIAL_PURCHASE, RENEWAL, CANCELLATION, etc.
    app_id: string;
    app_user_id: string;
    original_app_user_id: string;
    product_id: string;
    period_type: string;
    purchased_at_ms: number;
    expiration_at_ms?: number;
    environment: string;
    entitlement_id?: string;
    entitlement_ids?: string[];
    presented_offering_id?: string;
    transaction_id: string;
    original_transaction_id: string;
    is_family_share: boolean;
    country_code: string;
    price?: number;
    currency?: string;
    price_in_purchased_currency?: number;
    subscriber_attributes?: Record<string, any>;
    store: string; // APP_STORE, PLAY_STORE, etc.
    takehome_percentage?: number;
    offer_code?: string;
  };
}

Deno.serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify webhook secret from headers
    const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
    const authHeader = req.headers.get("authorization");

    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      console.error("Invalid webhook secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse RevenueCat webhook payload
    const payload: RevenueCatEvent = await req.json();

    console.log("Received RevenueCat event:", {
      type: payload.event.type,
      app_user_id: payload.event.app_user_id,
      product_id: payload.event.product_id,
    });

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store webhook event
    const { error: insertError } = await supabase
      .from("revenuecat_events")
      .insert({
        event_id: payload.event.id,
        event_type: payload.event.type,
        app_user_id: payload.event.app_user_id,
        product_id: payload.event.product_id,
        transaction_id: payload.event.transaction_id,
        original_transaction_id: payload.event.original_transaction_id,
        purchased_at: new Date(payload.event.purchased_at_ms).toISOString(),
        expiration_at: payload.event.expiration_at_ms
          ? new Date(payload.event.expiration_at_ms).toISOString()
          : null,
        price: payload.event.price || null,
        currency: payload.event.currency || null,
        country_code: payload.event.country_code,
        store: payload.event.store,
        environment: payload.event.environment,
        offering_id: payload.event.presented_offering_id || null,
        entitlement_ids: payload.event.entitlement_ids || [],
        subscriber_attributes: payload.event.subscriber_attributes || {},
        raw_payload: payload,
      });

    if (insertError) {
      console.error("Failed to insert webhook event:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store event" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // For INITIAL_PURCHASE events, try to attribute to onboarding session
    if (payload.event.type === "INITIAL_PURCHASE") {
      await attributeToOnboardingSession(supabase, payload);
    }

    // Return success (RevenueCat requires 200 response)
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

/**
 * Attempt to attribute a purchase to an onboarding session
 *
 * This looks for recent analytics events from the same user_id and
 * creates a paywall_conversion event if found.
 */
async function attributeToOnboardingSession(
  supabase: any,
  payload: RevenueCatEvent
) {
  try {
    const appUserId = payload.event.app_user_id;

    // Look for recent analytics events from this user (within last 24 hours)
    const { data: recentEvents } = await supabase
      .from("analytics_events")
      .select("session_id, organization_id, experiment_id, variant_id")
      .eq("user_id", appUserId)
      .gte("timestamp", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("timestamp", { ascending: false })
      .limit(1);

    if (recentEvents && recentEvents.length > 0) {
      const event = recentEvents[0];

      console.log("Attributing purchase to session:", {
        session_id: event.session_id,
        organization_id: event.organization_id,
      });

      // Create a paywall_conversion analytics event
      await supabase.from("analytics_events").insert({
        organization_id: event.organization_id,
        event_name: "paywall_conversion",
        user_id: appUserId,
        session_id: event.session_id,
        experiment_id: event.experiment_id,
        variant_id: event.variant_id,
        screen_id: "revenuecat_paywall",
        properties: {
          source: "revenuecat_webhook",
          product_id: payload.event.product_id,
          transaction_id: payload.event.transaction_id,
          price: payload.event.price,
          currency: payload.event.currency,
          offering_id: payload.event.presented_offering_id,
          store: payload.event.store,
          environment: payload.event.environment,
        },
        timestamp: new Date(payload.event.purchased_at_ms).toISOString(),
      });

      console.log("Successfully created paywall_conversion event");
    } else {
      console.log("No recent onboarding session found for user:", appUserId);
    }
  } catch (error) {
    console.error("Error attributing purchase to session:", error);
    // Don't fail the webhook if attribution fails
  }
}

/* To test locally:

  1. Set webhook secret: export REVENUECAT_WEBHOOK_SECRET=your_secret_here
  2. Run `supabase start`
  3. Send a test webhook:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/revenuecat-webhook' \
    --header 'Authorization: Bearer your_secret_here' \
    --header 'Content-Type: application/json' \
    --data '{
      "api_version": "1.0",
      "event": {
        "id": "test_event_123",
        "type": "INITIAL_PURCHASE",
        "app_id": "app_abc",
        "app_user_id": "user_xyz_789",
        "original_app_user_id": "user_xyz_789",
        "product_id": "premium_monthly",
        "period_type": "normal",
        "purchased_at_ms": 1707584400000,
        "expiration_at_ms": 1710176400000,
        "environment": "PRODUCTION",
        "presented_offering_id": "default",
        "transaction_id": "txn_123",
        "original_transaction_id": "txn_123",
        "is_family_share": false,
        "country_code": "US",
        "price": 9.99,
        "currency": "USD",
        "store": "APP_STORE"
      }
    }'

*/
