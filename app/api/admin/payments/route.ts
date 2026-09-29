import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PAGE_SIZE, pageCursor, paginatedDocs } from "@/lib/admin-pagination";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

function serializeDate(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value && "toDate" in value && typeof value.toDate === "function") return value.toDate().toISOString();
  return "";
}

function serializePayment(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    source: String(data.source || ""),
    bookingId: String(data.bookingId || ""),
    quotationId: String(data.quotationId || ""),
    quotationReference: String(data.quotationReference || ""),
    method: String(data.method || ""),
    referenceNumber: String(data.referenceNumber || ""),
    amountExpected: Number(data.amountExpected || 0),
    amountSubmitted: Number(data.amountSubmitted || 0),
    receiptUrl: String(data.receiptUrl || ""),
    paymentDate: String(data.paymentDate || ""),
    status: String(data.status || "for_verification"),
    createdAt: serializeDate(data.createdAt),
  };
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();

  const { adminDb } = await import("@/lib/firebase-admin");
  const collection = adminDb.collection("payments");
  const page = await paginatedDocs({
    query: collection.orderBy("createdAt", "desc"),
    collection,
    cursor: pageCursor(request),
  });
  const payments = page.docs.map((doc) => serializePayment(doc.id, doc.data()));
  const totalSnapshot = await collection.count().get();

  return NextResponse.json({
    payments,
    nextCursor: page.nextCursor,
    hasNext: page.hasNext,
    total: totalSnapshot.data().count || 0,
    pageSize: ADMIN_PAGE_SIZE,
  });
}
