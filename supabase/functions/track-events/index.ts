import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface AnalyticsEvent {
  event: string;
  user_id: string;
  session_id: string;
  timestamp: number;
  properties?: Record<string, any>;
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

    // Get API key from headers
    const apiKey = req.headers.get("x-api-key");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing API key" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { events } = await req.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid events array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Determine environment from API key prefix
    const isTestKey = apiKey.startsWith("nb_test_");
    const isProductionKey = apiKey.startsWith("nb_live_");

    // 2. Validate API key and get organization
    let organization;
    let orgError;

    if (isTestKey || isProductionKey) {
      // New dual-key system
      const keyField = isTestKey ? "test_api_key" : "production_api_key";
      const { data: org, error: err } = await supabase
        .from("organizations")
        .select("id")
        .eq(keyField, apiKey)
        .single();
      organization = org;
      orgError = err;
    } else {
      // Legacy single key (backwards compatibility)
      const { data: org, error: err } = await supabase
        .from("organizations")
        .select("id")
        .eq("api_key", apiKey)
        .single();
      organization = org;
      orgError = err;
    }

    if (orgError || !organization) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Get country from request headers (Cloudflare provides this)
    const country = req.headers.get("cf-ipcountry") || "Unknown";

    // 4. Transform events and add organization_id, country, and flow_id
    const eventsToInsert = events.map((event: AnalyticsEvent) => ({
      organization_id: organization.id,
      event_name: event.event,
      user_id: event.user_id,
      session_id: event.session_id,
      flow_id: event.properties?.flow_id || null,
      experiment_id: event.properties?.experiment_id || null,
      variant_id: event.properties?.variant_id || null,
      screen_id: event.properties?.screen_id || null,
      properties: {
        ...(event.properties || {}),
        country: country,
      },
      timestamp: event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString(),
    }));

    // 5. Bulk insert into analytics_events table
    const { error: insertError } = await supabase
      .from("analytics_events")
      .insert(eventsToInsert);

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to insert events" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6. Return success
    return new Response(
      JSON.stringify({
        success: true,
        inserted: eventsToInsert.length,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
        }
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

/* To invoke locally:

  1. Run `supabase start`
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/track-events' \
    --header 'x-api-key: your-api-key-here' \
    --header 'Content-Type: application/json' \
    --data '{
      "events": [
        {
          "event": "screen_viewed",
          "user_id": "device-xyz-789",
          "session_id": "session-abc-123",
          "timestamp": 1707584400000,
          "properties": {
            "screen_id": "welcome",
            "screen_type": "welcome_screen"
          }
        }
      ]
    }'

*/
