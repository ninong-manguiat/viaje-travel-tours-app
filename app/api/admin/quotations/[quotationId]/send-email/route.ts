import { NextRequest, NextResponse } from "next/server";
import { getQuotationWithItems, quotationItemDetail } from "@/lib/quotations";
import { publicAppUrl } from "@/lib/public-url";
import { sendQuotationEmail } from "@/lib/resend-template-registry";
import { formatPeso } from "@/lib/utils";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
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

  const quotationUrl = publicAppUrl(`/quotation/${quotation.publicToken}`, request);
  const quotationItemsHtml = quotation.items.map((item) => `
    <p>
      <strong>${escapeHtml(item.itemName)}</strong><br>
      ${quotationItemDetail(item) ? `${escapeHtml(quotationItemDetail(item)?.label ?? "")}: ${escapeHtml(quotationItemDetail(item)?.value ?? "")}<br>` : ""}
      Remarks: ${escapeHtml(item.remarks)}<br>
      Amount: ${escapeHtml(formatPeso(item.amount))}
    </p>
  `).join("");
  const quotationItemsText = quotation.items.map((item) => {
    const detail = quotationItemDetail(item);
    return [
      item.itemName,
      detail ? `${detail.label}: ${detail.value}` : "",
      `Remarks: ${item.remarks}`,
      `Amount: ${formatPeso(item.amount)}`,
    ].filter(Boolean).join("\n");
  }).join("\n\n");

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
