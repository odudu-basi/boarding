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
    const environment = isTestKey ? "test" : isProductionKey ? "production" : "test";

    // 2. Try to find the API key in projects table first (new system)
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
        // Fallback: check organizations table (backward compat)
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
      // Legacy single key (backwards compatibility)
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
    let configQuery = supabase
      .from("onboarding_configs")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("environment", environment)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(1);

    // Scope to project if available
    if (projectId) {
      configQuery = configQuery.eq("project_id", projectId);
    }

    const { data: configs, error: configError } = await configQuery;

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
    let experimentsQuery = supabase
      .from("experiments")
      .select("id, name, variants")
      .eq("organization_id", organizationId)
      .eq("status", "active");

    if (projectId) {
      experimentsQuery = experimentsQuery.eq("project_id", projectId);
    }

    const { data: experiments, error: experimentsError } = await experimentsQuery;

    if (experimentsError) {
      console.error("Experiments error:", experimentsError);
    }

    // 5. Return response
    return new Response(
      JSON.stringify({
        config,
        version,
        config_id: configId,
        experiments: experiments || [],
        organization_id: organizationId,
        project_id: projectId,
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
