import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { currentBookingBalance, getPublicBooking } from "@/lib/public-bookings";

export async function POST(request: NextRequest, { params }: { params: { bookingId: string } }) {
  const current = await getPublicBooking(params.bookingId);
  if (!current) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const { booking, payments } = current;
  const summary = currentBookingBalance(booking, payments);
  if (summary.remainingBalance <= 0) return NextResponse.json({ error: "This booking is already fully paid." }, { status: 409 });

  const body = await request.json().catch(() => ({}));
  const paymentMethodId = String(body?.paymentMethodId || "");
  const paymentMethodBank = String(body?.paymentMethodBank || "");
  const paymentMethodReferenceNumber = String(body?.paymentMethodReferenceNumber || "");
  const receiptUrl = String(body?.receiptUrl || "").trim();
  const notes = String(body?.notes || "");

  if (!paymentMethodId || !paymentMethodBank || !receiptUrl) {
    return NextResponse.json({ error: "Payment method and proof of payment are required." }, { status: 400 });
  }

  const { adminDb } = await import("@/lib/firebase-admin");
  const paymentId = `pay-${Date.now()}`;
  const transactionId = `txn-booking-${Date.now()}`;
  const payment = {
    id: paymentId,
    transactionId,
    bookingId: booking.id,
    clientId: null,
    source: "BOOKING",
    paymentName: "Manual Balance Payment",
    method: paymentMethodBank,
    paymentMethodId,
    paymentMethodReferenceNumber,
    referenceNumber: "",
    amountExpected: summary.remainingBalance,
    amountSubmitted: summary.remainingBalance,
    receiptUrl,
    paymentDate: new Date().toISOString().slice(0, 10),
    notes,
    status: "for_verification",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await adminDb.collection("payments").doc(paymentId).set(payment);
  await adminDb.collection("bookings").doc(booking.id).set({
    paymentStatus: "for_verification",
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return NextResponse.json({ payment });
}
