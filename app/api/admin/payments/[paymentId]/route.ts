import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

const allowedStatuses = ["for_verification", "verified", "rejected"];

export async function PATCH(request: NextRequest, { params }: { params: { paymentId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const status = String(body?.status || "");
  if (!allowedStatuses.includes(status)) return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });

  const { adminDb } = await import("@/lib/firebase-admin");
  const paymentRef = adminDb.collection("payments").doc(params.paymentId);
  const paymentDoc = await paymentRef.get();
  if (!paymentDoc.exists) return NextResponse.json({ error: "Payment not found." }, { status: 404 });

  const payment = paymentDoc.data() ?? {};
  await paymentRef.set({ status, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  if (payment.source === "QUOTATION" && payment.quotationId) {
    await adminDb.collection("quotations").doc(String(payment.quotationId)).set({
      paymentStatus: status === "verified" ? "VERIFIED" : status === "rejected" ? "REJECTED" : "PENDING FOR VERIFICATION",
      latestPaymentId: params.paymentId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  return NextResponse.json({ payment: { id: params.paymentId, ...payment, status } });
}
