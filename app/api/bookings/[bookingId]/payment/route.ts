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

function isPayableSchedule(item: { status?: string }) {
  return ["pending", "unpaid", "rejected"].includes(normalizedStatus(item.status || "pending"));
}

export async function POST(request: NextRequest, { params }: { params: { bookingId: string } }) {
  const current = await getPublicBooking(params.bookingId);
  if (!current) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const { booking, payments } = current;
  const summary = currentBookingBalance(booking, payments);
  if (summary.remainingBalance <= 0) return NextResponse.json({ error: "This booking is already fully paid." }, { status: 409 });

  const body = await request.json().catch(() => ({}));
  const requestedScheduleIds = Array.isArray(body?.scheduleIds)
    ? body.scheduleIds.map((item: unknown) => String(item || "").trim()).filter(Boolean)
    : [];
  const paymentMethodId = String(body?.paymentMethodId || "");
  const paymentMethodBank = String(body?.paymentMethodBank || "");
  const paymentMethodReferenceNumber = String(body?.paymentMethodReferenceNumber || "");
  const receiptUrl = String(body?.receiptUrl || "").trim();
  const notes = String(body?.notes || "");

  if (!paymentMethodId || !paymentMethodBank || !receiptUrl) {
    return NextResponse.json({ error: "Payment method and proof of payment are required." }, { status: 400 });
  }

  const selectedSchedule = booking.paymentSchedule.filter((item) => item.id && requestedScheduleIds.includes(String(item.id)));
  if (!requestedScheduleIds.length || selectedSchedule.length !== requestedScheduleIds.length) {
    return NextResponse.json({ error: "Select valid payment schedules before submitting payment." }, { status: 400 });
  }
  if (selectedSchedule.some((item) => !isPayableSchedule(item))) {
    return NextResponse.json({ error: "One or more selected schedules are no longer payable." }, { status: 409 });
  }

  const { adminDb } = await import("@/lib/firebase-admin");
  const transactionId = `txn-booking-${Date.now()}`;
  const amountDue = selectedSchedule.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const submittedPayments = [];

  for (const scheduleItem of selectedSchedule) {
    let paymentId = `pay-${Date.now()}-${scheduleItem.id}`;
    let existingPayment: FirebaseFirestore.QueryDocumentSnapshot | null = null;
    const existingPaymentSnapshot = await adminDb.collection("payments")
      .where("bookingId", "==", booking.id)
      .where("paymentScheduleId", "==", String(scheduleItem.id))
      .limit(1)
      .get();
    existingPayment = existingPaymentSnapshot.docs[0] ?? null;
    if (existingPayment) paymentId = existingPayment.id;

    const payment = {
      id: paymentId,
      transactionId,
      bookingId: booking.id,
      clientId: null,
      source: "BOOKING",
      bookingReference: booking.reference,
      paymentName: scheduleItem.label || "Manual Balance Payment",
      paymentScheduleId: scheduleItem.id || "",
      method: paymentMethodBank,
      paymentMethodId,
      paymentMethodReferenceNumber,
      referenceNumber: "",
      amountExpected: Number(scheduleItem.amount || 0),
      amountSubmitted: Number(scheduleItem.amount || 0),
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
    submittedPayments.push(payment);
  }

  const selectedIdSet = new Set(selectedSchedule.map((item) => String(item.id)));
  const paymentSchedule = booking.paymentSchedule.map((item) => selectedIdSet.has(String(item.id)) ? { ...item, status: "for_verification" } : item);
  await adminDb.collection("bookings").doc(booking.id).set({
    paymentSchedule,
    paymentStatus: derivedPaymentStatus(paymentSchedule),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  const contact = booking.groupContact || {};
  const actorName = [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim();
  await logActivity({
    type: "payment.submitted",
    module: "payments",
    entityType: "payment",
    entityId: submittedPayments[0]?.id || transactionId,
    reference: booking.reference,
    actorName,
    description: `${actorName || "A customer"} submitted a balance payment for ${booking.reference}.`,
    href: "/admin/payments/verification",
    metadata: { bookingId: booking.id, paymentScheduleIds: Array.from(selectedIdSet).join(","), amountSubmitted: amountDue },
  });

  return NextResponse.json({ payments: submittedPayments, amountSubmitted: amountDue });
}
