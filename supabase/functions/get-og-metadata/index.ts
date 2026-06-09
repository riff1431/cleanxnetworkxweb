import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULTS = {
  title: "The Cleaning Network | Find & Book Trusted Local Cleaners",
  description: "Find, compare, and book trusted local cleaners in Canada. Verified professionals, transparent pricing, secure payments, and instant booking.",
  image: "https://lovable.dev/opengraph-image-p98pqg.png",
  url: "https://thecleaningnetwork.ca",
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
      .select("setting_key, setting_value")
      .in("setting_key", ["og_title", "og_description", "og_image", "site_title", "site_description"]);

    const settings: Record<string, string> = {};
    data?.forEach((row: { setting_key: string; setting_value: string | null }) => {
      if (row.setting_value) settings[row.setting_key] = row.setting_value;
    });

    const title = settings.og_title || settings.site_title || DEFAULTS.title;
    const description = settings.og_description || settings.site_description || DEFAULTS.description;
    const image = settings.og_image || DEFAULTS.image;

    const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(description)}" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escHtml(DEFAULTS.url)}" />
  <meta property="og:title" content="${escHtml(title)}" />
  <meta property="og:description" content="${escHtml(description)}" />
  <meta property="og:image" content="${escHtml(image)}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@CleaningNetwork" />
  <meta name="twitter:title" content="${escHtml(title)}" />
  <meta name="twitter:description" content="${escHtml(description)}" />
  <meta name="twitter:image" content="${escHtml(image)}" />

  <link rel="canonical" href="${escHtml(DEFAULTS.url)}" />
  <meta http-equiv="refresh" content="0;url=${escHtml(DEFAULTS.url)}" />
</head>
<body>
  <p>Redirecting to <a href="${escHtml(DEFAULTS.url)}">${escHtml(title)}</a>...</p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return new Response(`<meta http-equiv="refresh" content="0;url=${DEFAULTS.url}" />`, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }
});
