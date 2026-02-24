import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface Variant {
  variant_id: string;
  weight: number;
  name: string;
  screens: any[];
}

// Weighted random selection algorithm
function weightedRandomSelection(variants: Variant[]): Variant {
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;

  for (const variant of variants) {
    if (random < variant.weight) {
      return variant;
    }
    random -= variant.weight;
  }

  // Fallback to first variant
  return variants[0];
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
    const { experiment_id, user_id } = await req.json();

    if (!experiment_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "Missing experiment_id or user_id" }),
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

    // 3. Check if user already has a variant assignment
    const { data: existingAssignment, error: assignmentError } = await supabase
      .from("variant_assignments")
      .select("variant_id")
      .eq("experiment_id", experiment_id)
      .eq("user_id", user_id)
      .single();

    // If user already assigned, get the variant config and return it
    if (existingAssignment && !assignmentError) {
      const { data: experiment } = await supabase
        .from("experiments")
        .select("variants")
        .eq("id", experiment_id)
        .eq("organization_id", organization.id)
        .single();

      if (experiment) {
        const variants = experiment.variants as Variant[];
        const assignedVariant = variants.find(
          v => v.variant_id === existingAssignment.variant_id
        );

        if (assignedVariant) {
          return new Response(
            JSON.stringify({
              variant_id: assignedVariant.variant_id,
              variant_config: {
                screens: assignedVariant.screens,
              },
              cached: true,
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
        }
      }
    }

    // 4. No existing assignment - get experiment and assign new variant
    const { data: experiment, error: experimentError } = await supabase
      .from("experiments")
      .select("variants, status")
      .eq("id", experiment_id)
      .eq("organization_id", organization.id)
      .single();

    if (experimentError || !experiment) {
      return new Response(
        JSON.stringify({ error: "Experiment not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (experiment.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Experiment is not active" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Weighted random selection
    const variants = experiment.variants as Variant[];
    const selectedVariant = weightedRandomSelection(variants);

    // 6. Insert variant assignment
    const { error: insertError } = await supabase
      .from("variant_assignments")
      .insert({
        experiment_id,
        user_id,
        variant_id: selectedVariant.variant_id,
      });

    if (insertError) {
      console.error("Insert assignment error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to assign variant" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 7. Return assigned variant
    return new Response(
      JSON.stringify({
        variant_id: selectedVariant.variant_id,
        variant_config: {
          screens: selectedVariant.screens,
        },
        cached: false,
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/assign-variant' \
    --header 'x-api-key: your-api-key-here' \
    --header 'Content-Type: application/json' \
    --data '{
      "experiment_id": "exp_123",
      "user_id": "device-xyz-789"
    }'

*/
