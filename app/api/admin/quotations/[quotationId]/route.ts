import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import {
  displayItemName,
  getQuotationWithItems,
  normalizeAmount,
  normalizeQuotation,
  normalizeQuotationItem,
  quotationItemTypes,
  secureToken,
  totalQuotationItems,
  type QuotationItemType,
} from "@/lib/quotations";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  if (!String(payload.contactNumber || "").trim()) return "Contact number is required.";
  if (!items.length) return "At least one quotation item is required.";
  for (const item of items) {
    if (item.type === "Other" && !item.customName.trim()) return "Custom item name is required for Other items.";
    if (!item.remarks.trim()) return "Remarks are required for each quotation item.";
    if (item.amount <= 0) return "Each quotation item amount must be greater than zero.";
  }
  return "";
}

export async function GET(request: NextRequest, { params }: { params: { quotationId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const quotation = await getQuotationWithItems(params.quotationId);
  if (!quotation) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  return NextResponse.json({ quotation });
}

export async function PUT(request: NextRequest, { params }: { params: { quotationId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const quotation = await getQuotationWithItems(params.quotationId);
  if (!quotation) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  if (["PENDING FOR VERIFICATION", "VERIFIED"].includes(quotation.paymentStatus)) {
    return NextResponse.json({ error: "Quotation with payment activity cannot be amount-edited." }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const items = normalizeItems(Array.isArray(body?.items) ? body.items : [], params.quotationId);
  const error = validatePayload(body, items);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const { adminDb } = await import("@/lib/firebase-admin");
  const existingItems = await adminDb.collection("quotationItems").where("quotationId", "==", params.quotationId).get();
  const nextItemIds = new Set(items.map((item) => item.id));

  await adminDb.collection("quotations").doc(params.quotationId).set({
    clientName: String(body.clientName || "").trim(),
    email: String(body.email || "").trim(),
    contactNumber: String(body.contactNumber || "").trim(),
    totalAmount: totalQuotationItems(items),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  await Promise.all([
    ...existingItems.docs.filter((doc) => !nextItemIds.has(doc.id)).map((doc) => doc.ref.delete()),
    ...items.map((item) => adminDb.collection("quotationItems").doc(item.id).set({
      ...item,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })),
  ]);

  const updated = await getQuotationWithItems(params.quotationId);
  return NextResponse.json({ quotation: updated });
}

export async function PATCH(request: NextRequest, { params }: { params: { quotationId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const action = String(body?.action || "");
  const quotation = await getQuotationWithItems(params.quotationId);
  if (!quotation) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

  const { adminDb } = await import("@/lib/firebase-admin");
  if (action === "finalize") {
    await adminDb.collection("quotations").doc(params.quotationId).set({
      status: "FINALIZED",
      finalizedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  } else if (action === "generatePaymentLink") {
    if (quotation.status !== "FINALIZED") return NextResponse.json({ error: "Finalize the quotation before generating a payment link." }, { status: 400 });
    await adminDb.collection("quotations").doc(params.quotationId).set({
      paymentToken: quotation.paymentToken || secureToken(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  } else {
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  }

  const updated = await getQuotationWithItems(params.quotationId);
  return NextResponse.json({ quotation: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: { quotationId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const { adminDb } = await import("@/lib/firebase-admin");
  const quotationRef = adminDb.collection("quotations").doc(params.quotationId);
  const doc = await quotationRef.get();
  if (!doc.exists) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

  const itemSnapshot = await adminDb.collection("quotationItems").where("quotationId", "==", params.quotationId).get();
  const paymentSnapshot = await adminDb.collection("payments").where("quotationId", "==", params.quotationId).get();
  await Promise.all([
    ...itemSnapshot.docs.map((item) => item.ref.delete()),
    ...paymentSnapshot.docs.map((payment) => payment.ref.set({
      quotationId: "",
      source: "QUOTATION",
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })),
    quotationRef.delete(),
  ]);

  return NextResponse.json({ ok: true });
}
