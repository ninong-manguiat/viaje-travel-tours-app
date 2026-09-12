import {
  type BookingConfirmedEmailData,
  type BookingReceivedEmailData,
  type DocumentRequestEmailData,
  type PaymentRequestEmailData,
  type SubsequentPaymentRequestEmailData,
  type TransactionalEmailType,
} from "@/lib/email-types";

const brand = {
  name: "Viaje Travel and Tours",
  tagline: "We make the plan, you pack your bags.",
  contactNumber: "09158375470",
  website: "viajetravelandtours.com",
  address: "2/F Lifestyle Plaza Building P. Guevarra Ave, Barangay 3, Sta Cruz, Laguna (above Figaro Coffee Shop)",
  facebook: "https://www.facebook.com/viajewithus/",
};

function appBaseUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL;
  if (!url) return "";
  return url.replace(/\/+$/, "");
}

function assetUrl(path: string) {
  const baseUrl = appBaseUrl();
  return baseUrl ? `${baseUrl}/${path.replace(/^\/+/, "")}` : "";
}

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function paragraph(value: string) {
  return `<p style="margin:0 0 16px;color:#42526b;font-size:15px;line-height:1.65;">${escapeHtml(value)}</p>`;
}

function rows(items: Array<[string, string | number]>) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:18px 0;border:1px solid #e7edf4;border-radius:8px;overflow:hidden;">
      ${items.map(([label, value]) => `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #e7edf4;color:#6b778c;font-size:13px;width:42%;">${escapeHtml(label)}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e7edf4;color:#10243f;font-size:14px;font-weight:700;">${escapeHtml(value)}</td>
        </tr>
      `).join("")}
    </table>
  `;
}

function cta(label: string, href: string) {
  if (!href) return "";
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
      <tr>
        <td bgcolor="#c9282d" style="border-radius:999px;">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 22px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>
  `;
}

function layout(title: string, preview: string, body: string) {
  const logoUrl = assetUrl("/brand/viaje-logo.png");
  const officeUrl = assetUrl("/brand/viaje-office.jpg");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e7edf4;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#10243f;padding:22px 26px;">
                ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(brand.name)}" width="148" style="display:block;max-width:148px;height:auto;">` : `<strong style="color:#ffffff;font-size:20px;">${escapeHtml(brand.name)}</strong>`}
                <p style="margin:10px 0 0;color:#dce6f2;font-size:13px;">${escapeHtml(brand.tagline)}</p>
              </td>
            </tr>
            ${officeUrl ? `<tr><td><img src="${escapeHtml(officeUrl)}" alt="" width="640" style="display:block;width:100%;max-width:640px;height:auto;"></td></tr>` : ""}
            <tr>
              <td style="padding:28px 26px;">
                <h1 style="margin:0 0 16px;color:#10243f;font-family:Georgia,serif;font-size:28px;line-height:1.2;">${escapeHtml(title)}</h1>
                ${body}
              </td>
            </tr>
            <tr>
              <td style="background:#f1f4f8;padding:22px 26px;color:#42526b;font-size:13px;line-height:1.6;">
                <strong style="color:#10243f;">${escapeHtml(brand.name)}</strong><br>
                ${escapeHtml(brand.contactNumber)}<br>
                ${escapeHtml(brand.website)}<br>
                ${escapeHtml(brand.address)}<br>
                <a href="${escapeHtml(brand.facebook)}" style="color:#c9282d;text-decoration:none;">Facebook</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function BookingReceivedEmail(data: BookingReceivedEmailData) {
  const summaryRows: Array<[string, string | number]> = [
    ["Booking Reference", data.bookingReference],
    ["Package", data.packageName],
    ["Departure Date", data.departureDate],
    ["Guest Count", data.guestCount],
    ["Total Amount", data.totalAmount],
    ["Payment Submitted", data.paymentAmount],
    ["Remaining Balance", data.remainingBalance],
    ["Payment Method", data.paymentMethod],
  ];

  if (data.itineraryContent.trim()) summaryRows.push(["Itinerary", data.itineraryContent]);

  return layout(
    "Booking Received",
    `We received booking ${data.bookingReference}.`,
    [
      paragraph(`Hi ${data.firstName}, thank you for booking with Viaje. We received your booking and our team will review it shortly.`),
      rows(summaryRows),
      cta("View Booking", data.bookingUrl),
    ].join("")
  );
}

export function BookingConfirmedEmail(data: BookingConfirmedEmailData) {
  return layout(
    "Booking Confirmed",
    `Booking ${data.bookingReference} is confirmed.`,
    [
      paragraph(`Hi ${data.firstName}, your booking has been confirmed. We are excited to help with your trip.`),
      rows([
        ["Booking Reference", data.bookingReference],
        ["Package", data.packageName],
        ["Payment", data.paymentName],
        ["Payment Amount", data.paymentAmount],
        ["Payment Method", data.paymentMethod],
        ["Payment Date", data.paymentDate],
        ["Total Amount", data.totalAmount],
        ["Total Paid", data.totalPaid],
        ["Remaining Balance", data.remainingBalance],
      ]),
      cta("View Booking", data.bookingUrl),
    ].join("")
  );
}

export function DocumentRequestEmail(data: DocumentRequestEmailData) {
  return layout(
    "Document Request",
    `Documents requested for ${data.documentBinReference}.`,
    [
      paragraph(`Hi ${data.clientName}, Viaje has requested documents for ${data.purpose}.`),
      rows([
        ["Document Bin Reference", data.documentBinReference],
        ["Purpose", data.purpose],
        ["Requested Documents", data.documentRequirements.join(", ")],
      ]),
      cta("Upload Documents", data.documentBinUrl),
    ].join("")
  );
}

export function PaymentRequestEmail(data: PaymentRequestEmailData) {
  return layout(
    "Payment Request",
    `Payment requested for ${data.bookingReference}.`,
    [
      paragraph(`Hi ${data.firstName}, a payment is requested for your booking.`),
      rows([
        ["Booking Reference", data.bookingReference],
        ["Package", data.packageName],
        ["Payment", data.paymentName],
        ["Amount Due", data.amountDue],
        ["Due Date", data.dueDate],
      ]),
      cta("Submit Payment", data.paymentUrl),
    ].join("")
  );
}

export function PaymentConfirmedEmail(data: SubsequentPaymentRequestEmailData) {
  const nextPayment = data.isFullyPaid
    ? [["Payment Status", "Fully paid"] as [string, string]]
    : [
        ["Next Payment", data.nextPaymentName || "To be advised"] as [string, string],
        ["Next Amount", data.nextPaymentAmount || "To be advised"] as [string, string],
        ["Next Due Date", data.nextPaymentDueDate || "To be advised"] as [string, string],
      ];

  return layout(
    "Payment Confirmed",
    `Payment confirmed for ${data.bookingReference}.`,
    [
      paragraph(`Hi ${data.firstName}, your payment has been confirmed.`),
      rows([
        ["Booking Reference", data.bookingReference],
        ["Payment", data.paymentName],
        ["Payment Amount", data.paymentAmount],
        ["Payment Method", data.paymentMethod],
        ["Payment Date", data.paymentDate],
        ["Total Amount", data.totalAmount],
        ["Total Paid", data.totalPaid],
        ["Remaining Balance", data.remainingBalance],
        ...nextPayment,
      ]),
      cta("View Booking", data.bookingUrl),
    ].join("")
  );
}

export const emailTemplateSubjects: Record<TransactionalEmailType, string> = {
  BOOKING_RECEIVED: "Viaje booking received",
  BOOKING_CONFIRMED: "Viaje booking confirmed",
  DOCUMENT_REQUEST: "Viaje document request",
  PAYMENT_REQUEST: "Viaje payment request",
  SUBSEQUENT_PAYMENT_REQUEST: "Viaje subsequent payment request",
  QUOTATION: "Viaje quotation",
};
