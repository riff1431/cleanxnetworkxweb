import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PaymentNotificationRequest {
  type: "verified" | "rejected" | "cleaner_confirmed";
  customerEmail: string;
  customerName: string;
  paymentId: string;
  bookingId: string;
  amount: number;
  cleanerName: string;
  cleanerEmail?: string;
  bookingDate: string;
  bookingTime?: string;
  serviceType?: string;
  customerAddress?: string;
  rejectionReason?: string;
}

const getVerifiedEmailHtml = (data: PaymentNotificationRequest) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Payment Verified ✓</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.customerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Great news! Your bank transfer payment has been verified and your booking is now confirmed.</p>
    
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #166534;">Booking Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Payment ID:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.paymentId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Booking ID:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.bookingId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Cleaner:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.cleanerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Scheduled Date:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.bookingDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Amount Paid:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #166534;">$${data.amount.toFixed(2)}</td>
        </tr>
      </table>
    </div>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Your cleaner has been notified and will arrive at the scheduled time. Please ensure someone is available to let them in.</p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      If you have any questions, please contact our support team.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      The Cleaning Network<br>
      This is an automated message. Please do not reply directly to this email.
    </p>
  </div>
</body>
</html>
`;

const getRejectedEmailHtml = (data: PaymentNotificationRequest) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Payment Issue</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.customerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Unfortunately, we were unable to verify your bank transfer payment for the following booking.</p>
    
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #991b1b;">Booking Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Payment ID:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.paymentId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Booking ID:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.bookingId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Cleaner:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.cleanerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Expected Amount:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">$${data.amount.toFixed(2)}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: 600; color: #9a3412;">Reason for rejection:</p>
      <p style="margin: 10px 0 0 0; color: #c2410c;">${data.rejectionReason || "Payment could not be verified"}</p>
    </div>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Your booking has been cancelled. If you believe this is an error, please contact our support team with your payment confirmation details.</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">You can rebook the service and try again with a different payment method if you prefer.</p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      The Cleaning Network<br>
      This is an automated message. Please do not reply directly to this email.
    </p>
  </div>
</body>
</html>
`;

const getCleanerConfirmedEmailHtml = (data: PaymentNotificationRequest) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Booking Confirmed! 🎉</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.cleanerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Great news! A new booking has been confirmed and is ready for you.</p>
    
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #1e40af;">Job Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Booking ID:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.bookingId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Customer:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.customerName}</td>
        </tr>
        ${data.serviceType ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Service:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.serviceType}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Date:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.bookingDate}</td>
        </tr>
        ${data.bookingTime ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Time:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.bookingTime}</td>
        </tr>
        ` : ''}
        ${data.customerAddress ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Address:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${data.customerAddress}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: 600; color: #166534;">Your Earnings</p>
      <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #15803d;">$${(data.amount * 0.9).toFixed(2)}</p>
      <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">(After 10% platform fee)</p>
    </div>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Please make sure you arrive on time and bring all necessary supplies. The customer is expecting you!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">View in Dashboard</a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      If you have any questions or need to reschedule, please contact the customer or our support team as soon as possible.
    </p>
    
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: PaymentNotificationRequest = await req.json();

    // Validate required fields
    if (!data.type || !data.customerEmail || !data.customerName || !data.paymentId) {
      throw new Error("Missing required fields");
    }

    const emailsToSend = [];

    // Customer email for verified/rejected
    if (data.type === "verified" || data.type === "rejected") {
      const isVerified = data.type === "verified";
      const subject = isVerified 
        ? `Payment Verified - Booking ${data.bookingId} Confirmed`
        : `Payment Issue - Booking ${data.bookingId}`;

      const html = isVerified 
        ? getVerifiedEmailHtml(data) 
        : getRejectedEmailHtml(data);

      emailsToSend.push({
        from: "The Cleaning Network <noreply@resend.dev>",
        to: [data.customerEmail],
        subject: subject,
        html: html,
      });
    }

    // Cleaner email for confirmed bookings
    if (data.type === "cleaner_confirmed" && data.cleanerEmail) {
      emailsToSend.push({
        from: "The Cleaning Network <noreply@resend.dev>",
        to: [data.cleanerEmail],
        subject: `New Booking Confirmed - ${data.bookingDate}`,
        html: getCleanerConfirmedEmailHtml(data),
      });
    }

    // Send all emails
    const results = await Promise.all(
      emailsToSend.map(email => resend.emails.send(email))
    );

    console.log(`Payment notification emails sent successfully:`, results);

    return new Response(JSON.stringify({ success: true, data: results }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-payment-notification function:", error);
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
