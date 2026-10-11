import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { logActivity } from "@/lib/activity-log";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

const allowedStatuses = ["for_verification", "verified", "rejected"];

function normalizedStatus(value: unknown) {
  return String(value || "").toLowerCase();
}

function numberValue(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function derivedPaymentStatus(schedule: Array<{ status?: string }>) {
  if (schedule.length && schedule.every((item) => ["verified", "paid"].includes(normalizedStatus(item.status)))) return "paid";
  if (schedule.some((item) => ["verified", "paid"].includes(normalizedStatus(item.status)))) return "partially_paid";
  if (schedule.some((item) => normalizedStatus(item.status) === "for_verification")) return "for_verification";
  return "pending";
}

function derivedBookingStatus(currentStatus: unknown, paymentSchedule: Array<{ id?: string; status?: string }>) {
  if (currentStatus === "CANCELLED") return "CANCELLED";

  const initialPayment = paymentSchedule.find((item) => item.id === "downpayment") ?? paymentSchedule.find((item) => item.id === "full-payment");
  if (initialPayment && ["verified", "paid"].includes(normalizedStatus(initialPayment.status))) return "CONFIRMED";

  return currentStatus === "CONFIRMED" ? "CONFIRMED" : "PENDING FOR VERIFICATION";
}

function paidFromSchedule(schedule: Array<{ amount?: number; status?: string }>) {
  return schedule.reduce((sum, item) => ["verified", "paid"].includes(normalizedStatus(item.status)) ? sum + numberValue(item.amount) : sum, 0);
}

function activeScheduleTotal(schedule: Array<{ amount?: number; status?: string }>) {
  return schedule.reduce((sum, item) => ["cancelled", "deleted"].includes(normalizedStatus(item.status)) ? sum : sum + numberValue(item.amount), 0);
}

function authoritativeTotal(booking: FirebaseFirestore.DocumentData, schedule: Array<{ amount?: number; status?: string }>) {
  return schedule.length ? activeScheduleTotal(schedule) : numberValue(booking.totalAmount ?? booking.bookingSelections?.finalAmount);
}

function matchingScheduleId(payment: FirebaseFirestore.DocumentData, schedule: Array<{ id?: string; label?: string; amount?: number }>) {
  const directId = String(payment.paymentScheduleId || payment.scheduleItemId || "");
  if (directId && schedule.some((item) => item.id === directId)) return directId;

  const paymentName = String(payment.paymentName || payment.label || "").trim().toLowerCase();
  if (paymentName) {
    const nameMatch = schedule.find((item) => String(item.label || "").trim().toLowerCase() === paymentName);
    if (nameMatch?.id) return nameMatch.id;
  }

  const expectedAmount = numberValue(payment.amountExpected || payment.amountSubmitted);
  const amountMatches = schedule.filter((item) => numberValue(item.amount) === expectedAmount);
  return amountMatches.length === 1 ? String(amountMatches[0].id || "") : "";
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
    bookingReference: String(data.bookingReference || ""),
    quotationId: String(data.quotationId || ""),
    quotationReference: String(data.quotationReference || ""),
    paymentScheduleId: String(data.paymentScheduleId || data.scheduleItemId || ""),
    paymentName: String(data.paymentName || data.label || ""),
    method: String(data.method || ""),
    paymentMethodReferenceNumber: String(data.paymentMethodReferenceNumber || ""),
    referenceNumber: String(data.referenceNumber || ""),
    amountExpected: Number(data.amountExpected || 0),
    amountSubmitted: Number(data.amountSubmitted || 0),
    receiptUrl: String(data.receiptUrl || ""),
    paymentDate: String(data.paymentDate || ""),
    notes: String(data.notes || ""),
    status: String(data.status || "for_verification"),
    createdAt: serializeDate(data.createdAt),
    updatedAt: serializeDate(data.updatedAt),
  };
}

export async function GET(request: NextRequest, { params }: { params: { paymentId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const { adminDb } = await import("@/lib/firebase-admin");
  const paymentDoc = await adminDb.collection("payments").doc(params.paymentId).get();
  if (!paymentDoc.exists) return NextResponse.json({ error: "Payment not found." }, { status: 404 });

  return NextResponse.json({ payment: serializePayment(paymentDoc.id, paymentDoc.data() ?? {}) });
}

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
  if (normalizedStatus(payment.status) !== "for_verification" || !String(payment.receiptUrl || "").trim()) {
    return NextResponse.json({ error: "Only submitted payments for verification can be approved or rejected." }, { status: 400 });
  }

  await paymentRef.set({ status, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  if (payment.source === "QUOTATION" && payment.quotationId) {
    await adminDb.collection("quotations").doc(String(payment.quotationId)).set({
      paymentStatus: status === "verified" ? "VERIFIED" : status === "rejected" ? "REJECTED" : "PENDING FOR VERIFICATION",
      latestPaymentId: params.paymentId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  if (payment.bookingId) {
    const bookingRef = adminDb.collection("bookings").doc(String(payment.bookingId));
    const bookingDoc = await bookingRef.get();
    const booking = bookingDoc.exists ? bookingDoc.data() ?? {} : null;
    const schedule = Array.isArray(booking?.paymentSchedule) ? booking.paymentSchedule : [];
    const scheduleItemId = matchingScheduleId(payment, schedule);

    if (booking && scheduleItemId) {
      const paymentSchedule = schedule.map((item) =>
        item.id === scheduleItemId ? { ...item, status } : item
      );
      const totalAmount = authoritativeTotal(booking, paymentSchedule);
      const amountPaid = paidFromSchedule(paymentSchedule);

      await bookingRef.set({
        paymentSchedule,
        paymentStatus: derivedPaymentStatus(paymentSchedule),
        status: derivedBookingStatus(booking.status, paymentSchedule),
        amountPaid,
        balance: Math.max(0, totalAmount - amountPaid),
        latestPaymentId: params.paymentId,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }

  const reference = String(payment.quotationReference || payment.bookingReference || payment.bookingId || payment.quotationId || params.paymentId);
  await logActivity({
    type: "payment.reviewed",
    module: "payments",
    entityType: "payment",
    entityId: params.paymentId,
    reference,
    actorName: "Admin",
    description: `Admin marked payment ${reference} as ${status.replace(/_/g, " ")}.`,
    href: "/admin/payments/verification",
    metadata: { status },
  });

  return NextResponse.json({ payment: serializePayment(params.paymentId, { ...payment, status, updatedAt: new Date().toISOString() }) });
}

export async function DELETE(request: NextRequest, { params }: { params: { paymentId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const { adminDb } = await import("@/lib/firebase-admin");
  const paymentRef = adminDb.collection("payments").doc(params.paymentId);
  const paymentDoc = await paymentRef.get();
  if (!paymentDoc.exists) return NextResponse.json({ error: "Payment not found." }, { status: 404 });

  const payment = paymentDoc.data() ?? {};
  const isPending = normalizedStatus(payment.status) === "pending";
  const hasSubmission = Boolean(String(payment.receiptUrl || "").trim()) || numberValue(payment.amountSubmitted) > 0 || Boolean(String(payment.transactionId || "").trim());

  if (!isPending || hasSubmission) {
    return NextResponse.json({ error: "Only pending payment logs without submitted payment history can be deleted." }, { status: 400 });
  }

  let updatedBooking: Record<string, unknown> | null = null;
  if (payment.bookingId && payment.paymentScheduleId) {
    const bookingRef = adminDb.collection("bookings").doc(String(payment.bookingId));
    const bookingDoc = await bookingRef.get();
    const booking = bookingDoc.exists ? bookingDoc.data() ?? {} : null;
    const schedule = Array.isArray(booking?.paymentSchedule) ? booking.paymentSchedule : [];

    if (booking) {
      const paymentSchedule = schedule.filter((item) => item.id !== payment.paymentScheduleId);
      const totalAmount = authoritativeTotal(booking, paymentSchedule);
      const amountPaid = paidFromSchedule(paymentSchedule);
      updatedBooking = {
        paymentSchedule,
        paymentStatus: derivedPaymentStatus(paymentSchedule),
        status: derivedBookingStatus(booking.status, paymentSchedule),
        amountPaid,
        balance: Math.max(0, totalAmount - amountPaid),
        updatedAt: FieldValue.serverTimestamp(),
      };
      await bookingRef.set(updatedBooking, { merge: true });
    }
  }

  await paymentRef.delete();

  const reference = String(payment.bookingReference || payment.bookingId || payment.quotationReference || payment.quotationId || params.paymentId);
  await logActivity({
    type: "payment.deleted",
    module: "payments",
    entityType: "payment",
    entityId: params.paymentId,
    reference,
    actorName: "Admin",
    description: `Admin deleted pending payment log ${reference}.`,
    href: "/admin/payments/verification",
    metadata: { paymentScheduleId: payment.paymentScheduleId || "" },
  });

  return NextResponse.json({ deleted: true, booking: updatedBooking });
}
