import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId, sendEmail } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch invoice
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (error || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch customer, cleaner, platform settings, and theme settings in parallel
    const [customerRes, cleanerRes, settingsRes, themeRes] = await Promise.all([
      supabase.from("profiles").select("full_name, email, phone").eq("id", invoice.customer_id).single(),
      invoice.cleaner_id
        ? supabase.from("cleaner_profiles").select("business_name").eq("user_id", invoice.cleaner_id).single()
        : Promise.resolve({ data: null }),
      supabase.from("platform_settings").select("platform_name, default_currency, support_email, platform_commission_rate, terms_url, privacy_url").limit(1).single(),
      supabase.from("theme_settings").select("setting_key, setting_value"),
    ]);

    const customer = customerRes.data;
    const cleanerName = cleanerRes.data?.business_name || "N/A";
    const settings = settingsRes.data;

    const platformName = settings?.platform_name || "The Cleaning Network";
    const currency = settings?.default_currency || "CAD";
    const supportEmail = settings?.support_email || "";
    const commissionRate = settings?.platform_commission_rate || 10;
    const termsUrl = settings?.terms_url || "";
    const privacyUrl = settings?.privacy_url || "";

    // Parse theme settings into a map
    const theme: Record<string, string> = {};
    if (themeRes.data) {
      for (const s of themeRes.data) {
        if (s.setting_value) theme[s.setting_key] = s.setting_value;
      }
    }

    const logoUrl = theme.logo_url || "";
    const primaryColor = theme.primary_color || "207 70% 35%";
    const secondaryColor = theme.secondary_color || "142 70% 45%";
    const accentColor = theme.accent_color || "45 93% 47%";
    const foregroundColor = theme.foreground_color || "215 25% 15%";
    const headingFont = theme.heading_font || "Inter";
    const bodyFont = theme.body_font || "Inter";

    const formatDate = (d: string) => {
      if (!d) return "N/A";
      return new Date(d).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
    };

    const amount = Number(invoice.amount);
    const commission = Number(invoice.commission_amount);
    const net = Number(invoice.net_amount);
    const taxEstimate = 0; // Placeholder for future tax integration

    const statusColors: Record<string, { bg: string; text: string }> = {
      paid: { bg: "#e8f5e9", text: "#2e7d32" },
      issued: { bg: "#fff3e0", text: "#e65100" },
      overdue: { bg: "#ffebee", text: "#c62828" },
      cancelled: { bg: "#f5f5f5", text: "#616161" },
    };
    const sc = statusColors[invoice.status] || statusColors.issued;

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(headingFont)}:wght@400;600;700&family=${encodeURIComponent(bodyFont)}:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --primary: hsl(${primaryColor});
    --secondary: hsl(${secondaryColor});
    --accent: hsl(${accentColor});
    --foreground: hsl(${foregroundColor});
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: '${bodyFont}', 'Helvetica Neue', Arial, sans-serif;
    color: var(--foreground);
    background: #fff;
    padding: 0;
    line-height: 1.6;
  }

  .invoice-wrapper { max-width: 800px; margin: 0 auto; padding: 40px; }

  /* Header with branded stripe */
  .header-stripe {
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    padding: 30px 40px;
    color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-stripe .brand {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .header-stripe .brand img {
    height: 48px;
    width: auto;
    border-radius: 8px;
    background: rgba(255,255,255,0.15);
    padding: 4px;
  }
  .header-stripe .brand-name {
    font-family: '${headingFont}', sans-serif;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
  .header-stripe .brand-email {
    font-size: 12px;
    opacity: 0.85;
    margin-top: 2px;
  }
  .header-stripe .invoice-label {
    text-align: right;
  }
  .header-stripe .invoice-label h1 {
    font-family: '${headingFont}', sans-serif;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 2px;
    margin-bottom: 4px;
  }
  .header-stripe .invoice-number {
    font-size: 13px;
    opacity: 0.9;
  }

  /* Status badge */
  .status-row {
    display: flex;
    justify-content: flex-end;
    padding: 16px 0 8px;
  }
  .badge {
    display: inline-block;
    padding: 5px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  /* Info grid */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 24px;
    margin: 24px 0 32px;
    padding: 24px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }
  .info-block {}
  .info-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #94a3b8;
    font-weight: 600;
    margin-bottom: 6px;
  }
  .info-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--foreground);
    margin-bottom: 4px;
  }
  .info-sub {
    font-size: 12px;
    color: #64748b;
  }

  /* Table */
  .items-section {
    margin-bottom: 24px;
  }
  .section-heading {
    font-family: '${headingFont}', sans-serif;
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--primary);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--primary);
  }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    text-align: left;
    padding: 12px 16px;
    background: linear-gradient(135deg, hsl(${primaryColor} / 0.08), hsl(${secondaryColor} / 0.05));
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #475569;
    font-weight: 700;
    border-bottom: 2px solid hsl(${primaryColor} / 0.2);
  }
  thead th:last-child { text-align: right; }
  tbody td {
    padding: 14px 16px;
    font-size: 14px;
    border-bottom: 1px solid #f1f5f9;
  }
  tbody td:last-child { text-align: right; font-weight: 600; }
  tbody tr:hover { background: #fafbfc; }

  /* Totals */
  .totals-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 32px;
  }
  .totals-box {
    width: 320px;
    background: #f8fafc;
    border-radius: 12px;
    padding: 20px 24px;
    border: 1px solid #e2e8f0;
  }
  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 14px;
    color: #475569;
  }
  .total-row.commission { color: #ef4444; }
  .total-row.grand {
    font-size: 18px;
    font-weight: 700;
    color: var(--primary);
    border-top: 2px solid var(--primary);
    padding-top: 12px;
    margin-top: 8px;
  }

  /* Notes & Payment Info */
  .details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 32px;
  }
  .detail-card {
    background: #f8fafc;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e2e8f0;
  }
  .detail-card h3 {
    font-family: '${headingFont}', sans-serif;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--primary);
    margin-bottom: 10px;
    font-weight: 700;
  }
  .detail-card p {
    font-size: 13px;
    color: #64748b;
    line-height: 1.7;
  }

  /* Footer */
  .footer {
    text-align: center;
    padding: 24px 0 0;
    border-top: 2px solid hsl(${primaryColor} / 0.15);
  }
  .footer .thank-you {
    font-family: '${headingFont}', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: var(--primary);
    margin-bottom: 8px;
  }
  .footer .footer-meta {
    font-size: 11px;
    color: #94a3b8;
  }
  .footer .footer-links {
    margin-top: 8px;
    font-size: 11px;
  }
  .footer .footer-links a {
    color: var(--primary);
    text-decoration: none;
    margin: 0 8px;
  }

  @media print {
    body { padding: 0; }
    .invoice-wrapper { padding: 20px; }
    .header-stripe { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="header-stripe">
    <div class="brand">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : ""}
      <div>
        <div class="brand-name">${platformName}</div>
        ${supportEmail ? `<div class="brand-email">${supportEmail}</div>` : ""}
      </div>
    </div>
    <div class="invoice-label">
      <h1>INVOICE</h1>
      <div class="invoice-number">${invoice.invoice_number}</div>
    </div>
  </div>

  <div class="invoice-wrapper">
    <div class="status-row">
      <span class="badge" style="background:${sc.bg};color:${sc.text};">${invoice.status.toUpperCase()}</span>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <div class="info-label">Bill To</div>
        <div class="info-value">${customer?.full_name || "Customer"}</div>
        ${customer?.email ? `<div class="info-sub">${customer.email}</div>` : ""}
        ${customer?.phone ? `<div class="info-sub">${customer.phone}</div>` : ""}
      </div>
      <div class="info-block">
        <div class="info-label">Service Provider</div>
        <div class="info-value">${cleanerName}</div>
      </div>
      <div class="info-block">
        <div class="info-label">Invoice Date</div>
        <div class="info-value">${formatDate(invoice.created_at)}</div>
        <div class="info-label" style="margin-top:10px;">Service Date</div>
        <div class="info-value">${formatDate(invoice.service_date)}</div>
        ${invoice.due_date ? `<div class="info-label" style="margin-top:10px;">Due Date</div><div class="info-value">${formatDate(invoice.due_date)}</div>` : ""}
      </div>
    </div>

    <div class="items-section">
      <div class="section-heading">Services Rendered</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align:center;width:100px;">Qty</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${invoice.service_type}</td>
            <td style="text-align:center;">1</td>
            <td>$${amount.toFixed(2)} ${currency}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="totals-wrapper">
      <div class="totals-box">
        <div class="total-row">
          <span>Subtotal</span>
          <span>$${amount.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>Tax</span>
          <span>$${taxEstimate.toFixed(2)}</span>
        </div>
        <div class="total-row commission">
          <span>Platform Commission (${commissionRate}%)</span>
          <span>−$${commission.toFixed(2)}</span>
        </div>
        <div class="total-row grand">
          <span>Net Payout</span>
          <span>$${net.toFixed(2)} ${currency}</span>
        </div>
      </div>
    </div>

    <div class="details-grid">
      ${invoice.notes ? `
      <div class="detail-card">
        <h3>Notes</h3>
        <p>${invoice.notes}</p>
      </div>` : ""}
      <div class="detail-card">
        <h3>Payment Information</h3>
        <p>
          Status: <strong>${invoice.status === "paid" ? "Paid" : "Pending"}</strong><br/>
          ${invoice.paid_at ? `Paid on: ${formatDate(invoice.paid_at)}<br/>` : ""}
          Currency: ${currency}<br/>
          Commission Rate: ${commissionRate}%
        </p>
      </div>
    </div>

    <div class="footer">
      <div class="thank-you">Thank you for choosing ${platformName}!</div>
      <div class="footer-meta">
        ${platformName} &bull; Invoice ${invoice.invoice_number} &bull; Generated ${formatDate(invoice.created_at)}
      </div>
      ${termsUrl || privacyUrl ? `
      <div class="footer-links">
        ${termsUrl ? `<a href="${termsUrl}">Terms of Service</a>` : ""}
        ${privacyUrl ? `<a href="${privacyUrl}">Privacy Policy</a>` : ""}
      </div>` : ""}
    </div>
  </div>
</body>
</html>`;

    // Send email if requested
    if (sendEmail && customer?.email) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `${platformName} <onboarding@resend.dev>`,
            to: [customer.email],
            subject: `Invoice ${invoice.invoice_number} - ${invoice.service_type}`,
            html,
          }),
        });
      }
    }

    return new Response(JSON.stringify({ html, invoice }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
