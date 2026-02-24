import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface OnboardingConfig {
  version: string;
  screens: any[];
}

interface Experiment {
  id: string;
  name: string;
  variants: any[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    });
  }

  try {
    // Get API key from headers
    const apiKey = req.headers.get("x-api-key");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing API key" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          }
        }
      );
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Determine environment from API key prefix
    const isTestKey = apiKey.startsWith("nb_test_");
    const isProductionKey = apiKey.startsWith("nb_live_");
    const environment = isTestKey ? "test" : isProductionKey ? "production" : "test"; // default to test for backwards compatibility

    // 2. Validate API key and get organization
    let organization;
    let orgError;

    if (isTestKey || isProductionKey) {
      // New dual-key system
      const keyField = isTestKey ? "test_api_key" : "production_api_key";
      const { data: org, error: err } = await supabase
        .from("organizations")
        .select("*")
        .eq(keyField, apiKey)
        .single();
      organization = org;
      orgError = err;
    } else {
      // Legacy single key (backwards compatibility)
      const { data: org, error: err } = await supabase
        .from("organizations")
        .select("*")
        .eq("api_key", apiKey)
        .single();
      organization = org;
      orgError = err;
    }

    if (orgError || !organization) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          }
        }
      );
    }

    // 3. Get latest published config for the environment
    const { data: configs, error: configError } = await supabase
      .from("onboarding_configs")
      .select("*")
      .eq("organization_id", organization.id)
      .eq("environment", environment)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (configError) {
      console.error("Config error:", configError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch config" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          }
        }
      );
    }

    // If no published config, return empty config
    const config = configs && configs.length > 0
      ? configs[0].config
      : { version: "1.0.0", screens: [] };

    const version = configs && configs.length > 0
      ? configs[0].version
      : "1.0.0";

    const configId = configs && configs.length > 0
      ? configs[0].id
      : null;

    // 4. Get active experiments
    const { data: experiments, error: experimentsError } = await supabase
      .from("experiments")
      .select("id, name, variants")
      .eq("organization_id", organization.id)
      .eq("status", "active");

    if (experimentsError) {
      console.error("Experiments error:", experimentsError);
      // Don't fail if experiments fail, just return empty array
    }

    // 5. Return response
    return new Response(
      JSON.stringify({
        config,
        version,
        config_id: configId,
        experiments: experiments || [],
        organization_id: organization.id,
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
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start`
  2. Make an HTTP request:

  curl -i --location --request GET 'http://127.0.0.1:54321/functions/v1/get-config' \
    --header 'x-api-key: your-api-key-here'

*/
