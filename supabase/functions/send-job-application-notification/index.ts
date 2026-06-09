import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface JobApplicationNotificationRequest {
  jobId: string;
  applicantName: string;
  coverMessage: string | null;
  proposedRate: number | null;
}

const getApplicationEmailHtml = (data: {
  posterName: string;
  jobTitle: string;
  applicantName: string;
  coverMessage: string | null;
  proposedRate: number | null;
  location: string;
  serviceType: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Job Application 📋</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.posterName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Someone has applied to your job posting. Here are the details:</p>
    
    <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #3730a3;">Application Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Job:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.jobTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Service:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.serviceType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Location:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.location}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Applicant:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.applicantName}</td>
        </tr>
        ${data.proposedRate ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Proposed Rate:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #15803d;">$${data.proposedRate}/hr</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    ${data.coverMessage ? `
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #374151;">Message from applicant:</p>
      <p style="margin: 0; color: #4b5563; font-style: italic;">"${data.coverMessage}"</p>
    </div>
    ` : ''}
    
    <p style="font-size: 16px; margin-bottom: 20px;">Log in to your dashboard to review and respond to this application.</p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      The Cleaning Network<br>
      This is an automated message. Please do not reply directly to this email.
    </p>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body: JobApplicationNotificationRequest = await req.json();
    if (!body.jobId) {
      throw new Error("Missing jobId");
    }

    // Use service role to fetch job + poster info
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Fetch job details
    const { data: job, error: jobError } = await adminClient
      .from("jobs")
      .select("title, user_id, location, service_type")
      .eq("id", body.jobId)
      .single();

    if (jobError || !job) {
      throw new Error("Job not found");
    }

    // Fetch poster profile
    const { data: poster } = await adminClient
      .from("profiles")
      .select("full_name, email")
      .eq("id", job.user_id)
      .single();

    if (!poster?.email) {
      console.log("No email found for job poster, skipping notification");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const html = getApplicationEmailHtml({
      posterName: poster.full_name || "there",
      jobTitle: job.title,
      applicantName: body.applicantName || "A cleaner",
      coverMessage: body.coverMessage,
      proposedRate: body.proposedRate,
      location: job.location,
      serviceType: job.service_type,
    });

    const result = await resend.emails.send({
      from: "The Cleaning Network <noreply@resend.dev>",
      to: [poster.email],
      subject: `New Application for "${job.title}"`,
      html,
    });

    console.log("Job application notification sent:", result);

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-job-application-notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
