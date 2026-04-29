import nodemailer from "nodemailer";

import { logger } from "./logger";

const COMPANY_NAME = "Maya Import Export Logistic";
const COMPANY_ADDRESS = "Anandamaya Marg, Dhumbarahi, Kathmandu, Nepal";
const COMPANY_PHONE = "+977 9769686908";
const COMPANY_EMAIL = "greenhouse2053@gmail.com";
const WHATSAPP = "https://wa.me/9779769686908";

export type ShipmentStatus =
  | "pending"
  | "collected"
  | "at_warehouse"
  | "customs_clearance"
  | "in_transit"
  | "arrived"
  | "delivered";

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: "Order Received",
  collected: "Shipment Collected",
  at_warehouse: "At Warehouse",
  customs_clearance: "Customs Clearance",
  in_transit: "In Transit",
  arrived: "Arrived at Office",
  delivered: "Dispatched",
};

export const STATUS_DESCRIPTIONS: Record<ShipmentStatus, string> = {
  pending:
    "We have received your shipment request. Our team will collect your package soon.",
  collected:
    "Your shipment has been collected and is being prepared for dispatch.",
  at_warehouse:
    "Your shipment has arrived at our warehouse and is being processed.",
  customs_clearance:
    "Your shipment is currently going through customs clearance. This may take a few days.",
  in_transit:
    "Great news! Your shipment is on its way to the destination.",
  arrived:
    "Your shipment has arrived at our destination office and is ready for delivery.",
  delivered:
    "Your shipment has been dispatched and delivered successfully. Thank you for choosing Maya Logistics!",
};

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  pending: "#f59e0b",
  collected: "#3b82f6",
  at_warehouse: "#8b5cf6",
  customs_clearance: "#f97316",
  in_transit: "#06b6d4",
  arrived: "#10b981",
  delivered: "#22c55e",
};

const STATUS_ICONS: Record<ShipmentStatus, string> = {
  pending: "📦",
  collected: "🚚",
  at_warehouse: "🏭",
  customs_clearance: "🛃",
  in_transit: "✈️",
  arrived: "🏢",
  delivered: "✅",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function createTransport() {
  // Prefer Resend SMTP if API key is set
  if (process.env.RESEND_API_KEY) {
    return nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: { user: "resend", pass: process.env.RESEND_API_KEY },
    });
  }
  // Fall back to Gmail
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
  });
}

function getSenderAddress(): string {
  // When using Resend, must send from a verified domain
  // Use onboarding@resend.dev for testing or a verified domain
  if (process.env.RESEND_API_KEY) {
    return process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  }
  return process.env.GMAIL_USER ?? COMPANY_EMAIL;
}

function htmlTemplate(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${COMPANY_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <!-- Header -->
      <tr><td style="background:#0f1f3d;padding:28px 40px;text-align:center;">
        <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">${COMPANY_NAME}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">${COMPANY_ADDRESS}</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:36px 40px;">${body}</td></tr>
      <!-- Footer -->
      <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#64748b;">
          ${COMPANY_NAME} &middot; ${COMPANY_ADDRESS}<br/>
          Tel: ${COMPANY_PHONE} &middot; <a href="mailto:${COMPANY_EMAIL}" style="color:#dc2626;">${COMPANY_EMAIL}</a><br/>
          <a href="${WHATSAPP}" style="color:#25d366;">Chat on WhatsApp</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export interface ShipmentEmailData {
  trackingId: string;
  customerName: string;
  customerEmail: string;
  origin: string;
  destination: string;
  weight: number;
  cost: number;
}

export async function sendRegistrationOtpEmail(
  toEmail: string,
  name: string,
  otp: string,
): Promise<void> {
  const transport = createTransport();
  if (!transport) {
    logger.warn("GMAIL credentials not set — skipping registration OTP email");
    return;
  }

  const safeName = escapeHtml(name);
  const body = `
    <h2 style="margin:0 0 4px;font-size:20px;color:#0f1f3d;">Verify Your Email Address</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">
      Hi <strong>${safeName}</strong>, welcome to Maya Import Export Logistic!<br/>
      Use the code below to verify your email and complete your registration.
      The code expires in <strong>15 minutes</strong>.
    </p>

    <div style="background:#eff6ff;border:2px solid #007bff;border-radius:12px;padding:28px 24px;margin-bottom:28px;text-align:center;">
      <p style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:2px;">Your Verification Code</p>
      <p style="margin:0;font-size:40px;font-weight:800;color:#007bff;letter-spacing:10px;font-family:monospace;">${otp}</p>
    </div>

    <p style="margin:0 0 4px;font-size:13px;color:#64748b;">
      If you did not create an account, please ignore this email.
    </p>
  `;

  await transport.sendMail({
    from: `"${COMPANY_NAME}" <${getSenderAddress()}>`,
    to: toEmail,
    subject: `🔐 ${otp} — Your Maya Logistics Email Verification Code`,
    html: htmlTemplate(body),
  });

  logger.info({ to: toEmail }, "Registration OTP email sent");
}

export async function sendOtpEmail(
  toEmail: string,
  otp: string,
): Promise<void> {
  const transport = createTransport();
  if (!transport) {
    logger.warn("GMAIL credentials not set — skipping OTP email");
    return;
  }

  const body = `
    <h2 style="margin:0 0 4px;font-size:20px;color:#0f1f3d;">Password Reset Request</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">
      We received a request to reset your Maya Logistics account password.
      Use the code below — it expires in <strong>15 minutes</strong>.
    </p>

    <div style="background:#fef2f2;border:2px solid #dc2626;border-radius:12px;padding:28px 24px;margin-bottom:28px;text-align:center;">
      <p style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:2px;">Your One-Time Code</p>
      <p style="margin:0;font-size:40px;font-weight:800;color:#dc2626;letter-spacing:10px;font-family:monospace;">${otp}</p>
    </div>

    <p style="margin:0 0 4px;font-size:13px;color:#64748b;">
      If you did not request a password reset, please ignore this email or contact support.
    </p>
  `;

  await transport.sendMail({
    from: `"${COMPANY_NAME}" <${getSenderAddress()}>`,
    to: toEmail,
    subject: `🔐 Your Maya Logistics Password Reset Code: ${otp}`,
    html: htmlTemplate(body),
  });

  logger.info({ to: toEmail }, "OTP email sent");
}

export async function sendStatusUpdateEmail(
  shipment: ShipmentEmailData,
  status: ShipmentStatus,
): Promise<void> {
  const transport = createTransport();
  if (!transport) {
    logger.warn("GMAIL credentials not set — skipping status email");
    return;
  }

  const label = STATUS_LABELS[status];
  const description = STATUS_DESCRIPTIONS[status];
  const color = STATUS_COLORS[status];
  const icon = STATUS_ICONS[status];

  const progressSteps = (Object.keys(STATUS_LABELS) as ShipmentStatus[]).map(
    (s) => {
      const done = Object.keys(STATUS_LABELS).indexOf(s) <=
        Object.keys(STATUS_LABELS).indexOf(status);
      return `<td align="center" style="padding:0 4px;">
        <div style="width:28px;height:28px;border-radius:50%;background:${done ? color : "#e2e8f0"};color:${done ? "#fff" : "#94a3b8"};font-size:12px;line-height:28px;text-align:center;font-weight:700;">${done ? "✓" : ""}</div>
        <p style="margin:4px 0 0;font-size:10px;color:${done ? "#1e293b" : "#94a3b8"};text-align:center;">${STATUS_LABELS[s].split(" ")[0]}</p>
      </td>`;
    },
  );

  const body = `
    <h2 style="margin:0 0 4px;font-size:20px;color:#0f1f3d;">Shipment Update</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hi ${shipment.customerName}, here is an update on your shipment.</p>

    <!-- Status badge -->
    <div style="background:${color}18;border:2px solid ${color};border-radius:12px;padding:20px 24px;margin-bottom:28px;text-align:center;">
      <p style="margin:0;font-size:32px;">${icon}</p>
      <p style="margin:8px 0 4px;font-size:18px;font-weight:700;color:${color};">${label}</p>
      <p style="margin:0;font-size:14px;color:#475569;">${description}</p>
    </div>

    <!-- Progress bar -->
    <div style="margin-bottom:28px;overflow-x:auto;">
      <table cellpadding="0" cellspacing="0" style="min-width:100%;">
        <tr>${progressSteps.join("")}</tr>
      </table>
    </div>

    <!-- Shipment details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
      <tr style="background:#0f1f3d;"><td colspan="2" style="padding:12px 16px;"><p style="margin:0;font-size:12px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;">Shipment Details</p></td></tr>
      <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 16px;font-size:13px;color:#64748b;width:40%;">Tracking ID</td><td style="padding:10px 16px;font-size:13px;font-weight:700;color:#0f1f3d;font-family:monospace;">${shipment.trackingId}</td></tr>
      <tr style="border-bottom:1px solid #f1f5f9;background:#fafafa;"><td style="padding:10px 16px;font-size:13px;color:#64748b;">Origin</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#0f1f3d;">${shipment.origin}</td></tr>
      <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 16px;font-size:13px;color:#64748b;">Destination</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#0f1f3d;">${shipment.destination}</td></tr>
      <tr style="border-bottom:1px solid #f1f5f9;background:#fafafa;"><td style="padding:10px 16px;font-size:13px;color:#64748b;">Weight</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#0f1f3d;">${shipment.weight} kg</td></tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:#64748b;">Cost</td><td style="padding:10px 16px;font-size:13px;font-weight:700;color:#dc2626;">Rs. ${Number(shipment.cost).toLocaleString("en-IN")}</td></tr>
    </table>

    <p style="margin:0 0 8px;font-size:14px;color:#475569;">Questions? Contact us:</p>
    <a href="${WHATSAPP}" style="display:inline-block;background:#25d366;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-right:8px;">WhatsApp</a>
    <a href="mailto:${COMPANY_EMAIL}" style="display:inline-block;background:#0f1f3d;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Email Us</a>
  `;

  await transport.sendMail({
    from: `"${COMPANY_NAME}" <${getSenderAddress()}>`,
    to: shipment.customerEmail,
    subject: `${icon} ${label} — Tracking: ${shipment.trackingId}`,
    html: htmlTemplate(body),
  });

  logger.info(
    { trackingId: shipment.trackingId, status, to: shipment.customerEmail },
    "Status email sent",
  );
}

export async function sendPaymentConfirmedEmail(
  shipment: ShipmentEmailData,
): Promise<void> {
  const transport = createTransport();
  if (!transport) {
    logger.warn("GMAIL credentials not set — skipping payment email");
    return;
  }

  const body = `
    <h2 style="margin:0 0 4px;font-size:20px;color:#0f1f3d;">Payment Confirmed</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hi ${shipment.customerName}, we have received your payment. Thank you!</p>

    <div style="background:#d1fae518;border:2px solid #10b981;border-radius:12px;padding:20px 24px;margin-bottom:28px;text-align:center;">
      <p style="margin:0;font-size:36px;">✅</p>
      <p style="margin:8px 0 4px;font-size:18px;font-weight:700;color:#065f46;">Payment Received</p>
      <p style="margin:0;font-size:14px;color:#475569;">Your invoice is now available in your account dashboard.</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
      <tr style="background:#0f1f3d;"><td colspan="2" style="padding:12px 16px;"><p style="margin:0;font-size:12px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;">Payment Summary</p></td></tr>
      <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 16px;font-size:13px;color:#64748b;width:40%;">Tracking ID</td><td style="padding:10px 16px;font-size:13px;font-weight:700;color:#0f1f3d;font-family:monospace;">${shipment.trackingId}</td></tr>
      <tr style="border-bottom:1px solid #f1f5f9;background:#fafafa;"><td style="padding:10px 16px;font-size:13px;color:#64748b;">Route</td><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#0f1f3d;">${shipment.origin} → ${shipment.destination}</td></tr>
      <tr><td style="padding:10px 16px;font-size:13px;color:#64748b;">Amount Paid</td><td style="padding:10px 16px;font-size:16px;font-weight:700;color:#dc2626;">Rs. ${Number(shipment.cost).toLocaleString("en-IN")}</td></tr>
    </table>

    <p style="margin:0 0 8px;font-size:14px;color:#475569;">Log in to your account to view and download your invoice.</p>
    <a href="${WHATSAPP}" style="display:inline-block;background:#25d366;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-right:8px;">WhatsApp</a>
    <a href="mailto:${COMPANY_EMAIL}" style="display:inline-block;background:#0f1f3d;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Email Us</a>
  `;

  await transport.sendMail({
    from: `"${COMPANY_NAME}" <${getSenderAddress()}>`,
    to: shipment.customerEmail,
    subject: `✅ Payment Confirmed — Tracking: ${shipment.trackingId}`,
    html: htmlTemplate(body),
  });

  logger.info(
    { trackingId: shipment.trackingId, to: shipment.customerEmail },
    "Payment confirmed email sent",
  );
}
