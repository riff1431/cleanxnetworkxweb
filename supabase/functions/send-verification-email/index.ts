import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, document_type, file_url } = await req.json();

    if (!user_id || !document_type) {
      return new Response(
        JSON.stringify({ error: "user_id and document_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get provider profile info
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user_id)
      .single();

    const { data: cleanerProfile } = await supabaseAdmin
      .from("cleaner_profiles")
      .select("business_name")
      .eq("user_id", user_id)
      .single();

    // Get admin email from platform_settings
    const { data: settings } = await supabaseAdmin
      .from("platform_settings")
      .select("support_email")
      .limit(1)
      .single();

    const adminEmail = settings?.support_email;
    if (!adminEmail) {
      console.warn("No support_email configured in platform_settings");
      return new Response(
        JSON.stringify({ warning: "No admin email configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const documentTypeLabels: Record<string, string> = {
      insurance: "Company Insurance",
      employee_list: "Employee Names List",
      criminal_check: "Criminal Background Check",
      articles_of_incorporation: "Articles of Incorporation",
    };

    const providerName = cleanerProfile?.business_name || profile?.full_name || "Unknown Provider";
    const docLabel = documentTypeLabels[document_type] || document_type;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Verification <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `New Verification Document: ${docLabel} from ${providerName}`,
        html: `
          <h2>New Verification Document Submitted</h2>
          <p><strong>Provider:</strong> ${providerName}</p>
          <p><strong>Email:</strong> ${profile?.email || "N/A"}</p>
          <p><strong>Document Type:</strong> ${docLabel}</p>
          <p>Please review this document in the admin dashboard and update the verification status.</p>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Resend error:", errText);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
