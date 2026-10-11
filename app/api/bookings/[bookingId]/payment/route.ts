import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { logActivity } from "@/lib/activity-log";
import { currentBookingBalance, getPublicBooking } from "@/lib/public-bookings";

function normalizedStatus(value: unknown) {
  return String(value || "").toLowerCase();
}

function derivedPaymentStatus(schedule: Array<{ status?: string }>) {
  if (schedule.length && schedule.every((item) => ["verified", "paid"].includes(normalizedStatus(item.status)))) return "paid";
  if (schedule.some((item) => ["verified", "paid"].includes(normalizedStatus(item.status)))) return "partially_paid";
  if (schedule.some((item) => normalizedStatus(item.status) === "for_verification")) return "for_verification";
  return "pending";
}

function nextPayableScheduleItem(schedule: Array<{ id?: string; label?: string; amount?: number; dueDate?: string; status?: string }>) {
  return schedule.find((item) => !["verified", "paid", "for_verification"].includes(normalizedStatus(item.status)));
}

export async function POST(request: NextRequest, { params }: { params: { bookingId: string } }) {
  const current = await getPublicBooking(params.bookingId);
  if (!current) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const { booking, payments } = current;
  const summary = currentBookingBalance(booking, payments);
  if (summary.remainingBalance <= 0) return NextResponse.json({ error: "This booking is already fully paid." }, { status: 409 });

  const scheduleItem = nextPayableScheduleItem(booking.paymentSchedule);
  if (booking.paymentSchedule.length && !scheduleItem) {
    return NextResponse.json({ error: "A payment is already submitted for verification." }, { status: 409 });
  }

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
  const transactionId = `txn-booking-${Date.now()}`;
  const amountDue = Number(scheduleItem?.amount || summary.remainingBalance);
  let paymentId = `pay-${Date.now()}`;
  let existingPayment: FirebaseFirestore.QueryDocumentSnapshot | null = null;

  if (scheduleItem?.id) {
    const existingPaymentSnapshot = await adminDb.collection("payments")
      .where("bookingId", "==", booking.id)
      .where("paymentScheduleId", "==", scheduleItem.id)
      .limit(1)
      .get();
    existingPayment = existingPaymentSnapshot.docs[0] ?? null;
    if (existingPayment) paymentId = existingPayment.id;
  }

  const payment = {
    id: paymentId,
    transactionId,
    bookingId: booking.id,
    clientId: null,
    source: "BOOKING",
    bookingReference: booking.reference,
    paymentName: scheduleItem?.label || "Manual Balance Payment",
    paymentScheduleId: scheduleItem?.id || "",
    method: paymentMethodBank,
    paymentMethodId,
    paymentMethodReferenceNumber,
    referenceNumber: "",
    amountExpected: amountDue,
    amountSubmitted: amountDue,
    receiptUrl,
    paymentDate: new Date().toISOString().slice(0, 10),
    notes,
    status: "for_verification",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await adminDb.collection("payments").doc(paymentId).set({
    ...payment,
    createdAt: existingPayment ? existingPayment.data().createdAt ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
  }, { merge: true });
  const paymentSchedule = scheduleItem
    ? booking.paymentSchedule.map((item) => item.id === scheduleItem.id ? { ...item, status: "for_verification" } : item)
    : booking.paymentSchedule;
  await adminDb.collection("bookings").doc(booking.id).set({
    ...(scheduleItem ? { paymentSchedule } : {}),
    paymentStatus: scheduleItem ? derivedPaymentStatus(paymentSchedule) : "for_verification",
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  const contact = booking.groupContact || {};
  const actorName = [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim();
  await logActivity({
    type: "payment.submitted",
    module: "payments",
    entityType: "payment",
    entityId: paymentId,
    reference: booking.reference,
    actorName,
    description: `${actorName || "A customer"} submitted a balance payment for ${booking.reference}.`,
    href: "/admin/payments/verification",
    metadata: { bookingId: booking.id, paymentScheduleId: scheduleItem?.id || "", amountSubmitted: amountDue },
  });

  return NextResponse.json({ payment });
}
