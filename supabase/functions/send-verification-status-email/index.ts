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
    const { user_id, document_type, status, notes } = await req.json();

    if (!user_id || !document_type || !status) {
      return new Response(
        JSON.stringify({ error: "user_id, document_type, and status are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get provider info
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user_id)
      .single();

    if (!profile?.email) {
      return new Response(
        JSON.stringify({ error: "Provider email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: cleanerProfile } = await supabaseAdmin
      .from("cleaner_profiles")
      .select("business_name")
      .eq("user_id", user_id)
      .single();

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

    const providerName = cleanerProfile?.business_name || profile.full_name || "Provider";
    const docLabel = documentTypeLabels[document_type] || document_type;
    const isApproved = status === "approved";

    const subject = isApproved
      ? `✅ Your ${docLabel} has been approved`
      : `❌ Your ${docLabel} was not approved`;

    const statusColor = isApproved ? "#16a34a" : "#dc2626";
    const statusText = isApproved ? "Approved" : "Rejected";

    let bodyContent = `
      <h2 style="color: #1a1a1a;">Verification Document Update</h2>
      <p>Hi ${providerName},</p>
      <p>Your verification document <strong>${docLabel}</strong> has been reviewed.</p>
      <div style="padding: 16px; border-radius: 8px; background: #f9fafb; margin: 16px 0;">
        <p style="margin: 0;"><strong>Document:</strong> ${docLabel}</p>
        <p style="margin: 8px 0 0;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
        ${notes ? `<p style="margin: 8px 0 0;"><strong>Notes:</strong> ${notes}</p>` : ""}
      </div>
    `;

    if (isApproved) {
      // Check if all docs are now approved
      const { data: allDocs } = await supabaseAdmin
        .from("provider_verification_documents")
        .select("status")
        .eq("user_id", user_id);

      const allApproved = (allDocs || []).every((d: any) => d.status === "approved") && (allDocs || []).length >= 4;

      if (allApproved) {
        bodyContent += `
          <div style="padding: 16px; border-radius: 8px; background: #f0fdf4; border: 1px solid #bbf7d0; margin: 16px 0;">
            <p style="margin: 0; color: #16a34a; font-weight: bold;">🎉 Congratulations! All your documents are approved and your profile is now verified!</p>
          </div>
        `;
      } else {
        bodyContent += `<p>Keep submitting your remaining documents to complete your verification.</p>`;
      }
    } else {
      bodyContent += `
        <p>Please review the feedback above and resubmit your document. You can upload a new version from your Verification page in the dashboard.</p>
      `;
    }

    bodyContent += `<p style="color: #6b7280; font-size: 12px; margin-top: 24px;">— The Cleaning Network Team</p>`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Verification <onboarding@resend.dev>",
        to: [profile.email],
        subject,
        html: bodyContent,
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
