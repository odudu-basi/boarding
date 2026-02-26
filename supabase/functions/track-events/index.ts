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

    // 2. Resolve API key to organization (and optionally project)
    let organizationId: string | null = null;
    let projectId: string | null = null;

    if (isTestKey || isProductionKey) {
      const keyField = isTestKey ? "test_api_key" : "production_api_key";

      // Check projects table first
      const { data: project } = await supabase
        .from("projects")
        .select("id, organization_id")
        .eq(keyField, apiKey)
        .single();

      if (project) {
        organizationId = project.organization_id;
        projectId = project.id;
      } else {
        // Fallback: check organizations table
        const { data: org } = await supabase
          .from("organizations")
          .select("id")
          .eq(keyField, apiKey)
          .single();

        if (org) {
          organizationId = org.id;
        }
      }
    } else {
      // Legacy single key
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("api_key", apiKey)
        .single();

      if (org) {
        organizationId = org.id;
      }
    }

    if (!organizationId) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Get country from request headers (Cloudflare provides this)
    const country = req.headers.get("cf-ipcountry") || "Unknown";

    // 4. Transform events and add organization_id, project_id, country, and flow_id
    const eventsToInsert = events.map((event: AnalyticsEvent) => ({
      organization_id: organizationId,
      project_id: projectId,
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
