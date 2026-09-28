import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import {
  displayItemName,
  newQuotationId,
  nextQuotationReference,
  normalizeAmount,
  normalizeQuotation,
  normalizeQuotationItem,
  quotationItemTypes,
  secureToken,
  totalQuotationItems,
  type QuotationItemType,
} from "@/lib/quotations";
import { emailPattern, isValidContactNumber, normalizeContactNumber } from "@/lib/document-bins";
import { pageCursor, paginatedDocs, prefixSearchBounds } from "@/lib/admin-pagination";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

function normalizeItems(items: unknown[], quotationId: string) {
  return items.map((raw, index) => {
    const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const type = quotationItemTypes.includes(item.type as QuotationItemType) ? item.type as QuotationItemType : "Other";
    const normalized = normalizeQuotationItem(String(item.id || `qitem-${Date.now()}-${index}`), {
      ...item,
      quotationId,
      type,
      amount: normalizeAmount(item.amount),
      sortOrder: index,
    }, quotationId);
    return { ...normalized, itemName: displayItemName(normalized) };
  });
}

function validatePayload(payload: Record<string, unknown>, items: ReturnType<typeof normalizeItems>) {
  if (!String(payload.clientName || "").trim()) return "Client name is required.";
  if (!emailPattern.test(String(payload.email || "").trim())) return "A valid email address is required.";
  if (!isValidContactNumber(payload.contactNumber)) return "Contact number must be a valid +63 mobile number.";
  if (!items.length) return "At least one quotation item is required.";
  for (const item of items) {
    if (item.type === "Other" && !item.customName.trim()) return "Custom item name is required for Other items.";
    if (!item.remarks.trim()) return "Remarks are required for each quotation item.";
    if (item.amount <= 0) return "Each quotation item amount must be greater than zero.";
  }
  return "";
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();

  const { adminDb } = await import("@/lib/firebase-admin");
  const collection = adminDb.collection("quotations");
  const search = new URL(request.url).searchParams.get("search")?.trim() ?? "";
  const bounds = prefixSearchBounds(search);
  let query = collection.orderBy("createdAt", "desc");

  if (bounds) {
    const field = search.includes("@") ? "email" : search.toUpperCase().startsWith("VQ-") ? "referenceNumber" : "clientName";
    query = collection.orderBy(field).startAt(bounds.start).endAt(bounds.end);
  }

  const page = await paginatedDocs({ query, collection, cursor: pageCursor(request) });
  const quotations = page.docs.map((doc) => normalizeQuotation(doc.id, doc.data() ?? {}));
  return NextResponse.json({ quotations, nextCursor: page.nextCursor, hasNext: page.hasNext });
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const quotationId = newQuotationId();
  const items = normalizeItems(Array.isArray(body?.items) ? body.items : [], quotationId);
  const error = validatePayload(body, items);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const { adminDb } = await import("@/lib/firebase-admin");
  const referenceNumber = await nextQuotationReference();
  const quotation = {
    id: quotationId,
    referenceNumber,
    publicToken: secureToken(),
    clientName: String(body.clientName || "").trim(),
    email: String(body.email || "").trim(),
    contactNumber: normalizeContactNumber(body.contactNumber),
    status: "DRAFT",
    totalAmount: totalQuotationItems(items),
    paymentToken: "",
    paymentStatus: "UNPAID",
    latestPaymentId: "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    finalizedAt: null,
  };

  await adminDb.collection("quotations").doc(quotationId).set(quotation);
  await Promise.all(items.map((item) => adminDb.collection("quotationItems").doc(item.id).set({
    ...item,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })));

  return NextResponse.json({
    quotation: normalizeQuotation(quotationId, { ...quotation, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, items),
  });
}
