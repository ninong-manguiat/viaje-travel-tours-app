import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getQuotationByToken, secureToken } from "@/lib/quotations";

function isPayable(paymentStatus: string) {
  return ["UNPAID", "REJECTED"].includes(paymentStatus);
}

export async function POST(_request: Request, { params }: { params: { token: string } }) {
  const quotation = await getQuotationByToken("publicToken", params.token);
  if (!quotation || quotation.status !== "FINALIZED") {
    return NextResponse.json({ error: "Quotation payment is not available." }, { status: 404 });
  }
  if (!isPayable(quotation.paymentStatus)) {
    return NextResponse.json({ error: "This quotation is not currently available for payment." }, { status: 409 });
  }

  const { adminDb } = await import("@/lib/firebase-admin");
  const quotationRef = adminDb.collection("quotations").doc(quotation.id);
  const paymentToken = await adminDb.runTransaction(async (transaction) => {
    const current = await transaction.get(quotationRef);
    if (!current.exists) throw new Error("Quotation not found.");

    const data = current.data() ?? {};
    if (data.status !== "FINALIZED" || !isPayable(String(data.paymentStatus || "UNPAID"))) {
      throw new Error("Quotation payment is not available.");
    }

    const existingToken = String(data.paymentToken || "").trim();
    if (existingToken) return existingToken;

    const nextToken = secureToken();
    transaction.set(quotationRef, {
      paymentToken: nextToken,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return nextToken;
  }).catch((error) => {
    throw error instanceof Error ? error : new Error("Unable to prepare the payment link.");
  });

  return NextResponse.json({ paymentUrl: `/payment/quotation/${encodeURIComponent(paymentToken)}` });
}
