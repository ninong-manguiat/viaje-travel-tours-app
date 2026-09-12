import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getQuotationByToken } from "@/lib/quotations";

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const quotation = await getQuotationByToken("paymentToken", params.token);
  if (!quotation || quotation.status !== "FINALIZED") {
    return NextResponse.json({ error: "Quotation payment link is not available." }, { status: 404 });
  }
  if (quotation.paymentStatus === "PENDING FOR VERIFICATION" || quotation.paymentStatus === "VERIFIED") {
    return NextResponse.json({ error: "A payment for this quotation has already been submitted." }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const paymentMethodId = String(body?.paymentMethodId || "");
  const paymentMethodBank = String(body?.paymentMethodBank || "");
  const paymentMethodReferenceNumber = String(body?.paymentMethodReferenceNumber || "");
  const referenceNumber = String(body?.referenceNumber || "").trim();
  const receiptUrl = String(body?.receiptUrl || "").trim();

  if (!paymentMethodId || !paymentMethodBank || !referenceNumber || !receiptUrl) {
    return NextResponse.json({ error: "Payment method, transaction reference, and proof of payment are required." }, { status: 400 });
  }

  const { adminDb } = await import("@/lib/firebase-admin");
  const paymentId = `pay-${Date.now()}`;
  const transactionId = `txn-quotation-${Date.now()}`;
  const payment = {
    id: paymentId,
    transactionId,
    bookingId: "",
    clientId: null,
    source: "QUOTATION",
    quotationId: quotation.id,
    quotationReference: quotation.referenceNumber,
    method: paymentMethodBank,
    paymentMethodId,
    paymentMethodReferenceNumber,
    referenceNumber,
    amountExpected: quotation.totalAmount,
    amountSubmitted: quotation.totalAmount,
    receiptUrl,
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: String(body?.notes || ""),
    status: "for_verification",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const quotationRef = adminDb.collection("quotations").doc(quotation.id);
  const paymentRef = adminDb.collection("payments").doc(paymentId);
  const result = await adminDb.runTransaction(async (transaction) => {
    const quotationDoc = await transaction.get(quotationRef);
    const paymentStatus = String(quotationDoc.data()?.paymentStatus || "UNPAID");
    if (paymentStatus === "PENDING FOR VERIFICATION" || paymentStatus === "VERIFIED") return "already_submitted";

    transaction.set(paymentRef, payment);
    transaction.set(quotationRef, {
      paymentStatus: "PENDING FOR VERIFICATION",
      latestPaymentId: paymentId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return "submitted";
  });

  if (result === "already_submitted") {
    return NextResponse.json({ error: "A payment for this quotation has already been submitted." }, { status: 409 });
  }

  return NextResponse.json({ payment });
}
