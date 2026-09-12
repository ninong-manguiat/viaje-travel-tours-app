import { NextRequest, NextResponse } from "next/server";
import { getQuotationWithItems } from "@/lib/quotations";
import { sendQuotationEmail } from "@/lib/resend-template-registry";
import { formatPeso } from "@/lib/utils";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

function appUrl(request: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`).replace(/\/+$/, "");
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeSendError(message = "") {
  const normalized = message.toLowerCase();
  if (normalized.includes("api key")) return "Email service is not configured.";
  if (normalized.includes("domain") && normalized.includes("verif")) return "Email sender domain is not verified in Resend.";
  if (normalized.includes("from")) return "Email sender was rejected by Resend. Check EMAIL_FROM and sender domain verification.";
  return "Unable to send quotation email.";
}

export async function POST(request: NextRequest, { params }: { params: { quotationId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const quotation = await getQuotationWithItems(params.quotationId);
  if (!quotation) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  if (!emailPattern.test(quotation.email)) return NextResponse.json({ error: "Quotation has no valid email address." }, { status: 400 });

  const quotationUrl = `${appUrl(request)}/quotation/${quotation.publicToken}`;
  const quotationItemsHtml = quotation.items.map((item) => `
    <p>
      <strong>${escapeHtml(item.itemName)}</strong><br>
      ${escapeHtml(item.remarks)}<br>
      ${escapeHtml(formatPeso(item.amount))}
    </p>
  `).join("");
  const quotationItemsText = quotation.items.map((item) => [
    item.itemName,
    item.remarks,
    formatPeso(item.amount),
  ].join("\n")).join("\n\n");

  const result = await sendQuotationEmail({
    clientName: quotation.clientName,
    quotationReference: quotation.referenceNumber,
    quotationItemsHtml,
    quotationItemsText,
    grandTotal: formatPeso(quotation.totalAmount),
    quotationUrl,
  }, {
    recipient: quotation.email,
    subject: `Viaje quotation ${quotation.referenceNumber}`,
    relatedEntityType: "QUOTATION",
    relatedEntityId: quotation.id,
    relatedReference: quotation.referenceNumber,
    metadata: { quotationUrl, totalAmount: quotation.totalAmount },
  });

  if (!result.ok) return NextResponse.json({ error: safeSendError(result.error) }, { status: 500 });
  return NextResponse.json({ message: "Quotation email sent successfully.", result });
}
