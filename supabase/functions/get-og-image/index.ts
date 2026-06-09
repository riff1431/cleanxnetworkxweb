import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data } = await supabase
      .from("theme_settings")
      .select("setting_value")
      .eq("setting_key", "og_image")
      .maybeSingle();

    const ogImageUrl = data?.setting_value;

    if (ogImageUrl) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: ogImageUrl },
      });
    }

    // Fallback to default
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: "https://lovable.dev/opengraph-image-p98pqg.png" },
    });
  } catch (error) {
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: "https://lovable.dev/opengraph-image-p98pqg.png" },
    });
  }
});
