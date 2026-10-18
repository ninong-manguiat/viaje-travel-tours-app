import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { logActivity } from "@/lib/activity-log";
import { emailTemplateSubjects } from "@/lib/email-templates";
import { getPackageById } from "@/lib/package-data";
import { publicAppUrl } from "@/lib/public-url";
import { sendBookingConfirmedEmail, sendSubsequentPaymentEmail } from "@/lib/resend-template-registry";
import { formatDate, formatPeso } from "@/lib/utils";

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

  const activeSchedule = paymentSchedule.filter((item) => !["cancelled", "deleted"].includes(normalizedStatus(item.status)));
  const hasVerifiedPayment = activeSchedule.some((item) => ["verified", "paid"].includes(normalizedStatus(item.status)));
  if (!hasVerifiedPayment) return "PENDING FOR VERIFICATION";

  const allActivePaymentsVerified = activeSchedule.length > 0 && activeSchedule.every((item) => ["verified", "paid"].includes(normalizedStatus(item.status)));
  return allActivePaymentsVerified ? "CONFIRMED" : "RESERVED";
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

function validEmail(value: unknown) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function isInitialPayment(
  booking: FirebaseFirestore.DocumentData,
  payment: FirebaseFirestore.DocumentData,
  paymentId: string,
  paymentSchedule: Array<{ id?: string }>
) {
  const initialPaymentId = String(booking.initialPaymentId || "");
  if (initialPaymentId) return initialPaymentId === paymentId;

  const initialScheduleId = String(booking.initialPaymentScheduleId || paymentSchedule[0]?.id || "");
  return initialScheduleId !== "" && initialScheduleId === String(payment.paymentScheduleId || payment.scheduleItemId || "");
}

async function claimVerificationEmail(
  paymentRef: FirebaseFirestore.DocumentReference,
  emailType: "BOOKING_CONFIRMED" | "SUBSEQUENT_PAYMENT_REQUEST"
) {
  const { adminDb } = await import("@/lib/firebase-admin");
  return adminDb.runTransaction(async (transaction) => {
    const current = await transaction.get(paymentRef);
    if (!current.exists || current.data()?.verificationEmailType) return false;
    transaction.set(paymentRef, {
      verificationEmailType: emailType,
      verificationEmailAttemptedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return true;
  });
}

async function sendBookingConfirmedNotification({
  request,
  bookingId,
  booking,
  payment,
  paymentSchedule,
  amountPaid,
  totalAmount,
}: {
  request: NextRequest;
  bookingId: string;
  booking: FirebaseFirestore.DocumentData;
  payment: FirebaseFirestore.DocumentData;
  paymentSchedule: Array<{ id?: string; label?: string; amount?: number; status?: string }>;
  amountPaid: number;
  totalAmount: number;
}) {
  const recipient = String(booking.groupContact?.emailAddress || "").trim();
  if (!validEmail(recipient)) return { attempted: false, sent: false, reason: "missing_recipient" };

  const reference = String(booking.reference || payment.bookingReference || bookingId);
  const pkg = booking.packageId ? await getPackageById(String(booking.packageId)).catch(() => null) : null;
  const paymentAmount = numberValue(payment.amountSubmitted || payment.amountExpected);
  const remainingBalance = Math.max(0, totalAmount - amountPaid);
  const bookingUrl = publicAppUrl(`/dashboard/bookings/${encodeURIComponent(reference)}`, request);
  const matchedSchedule = paymentSchedule.find((item) => item.id === String(payment.paymentScheduleId || payment.scheduleItemId || ""));

  const result = await sendBookingConfirmedEmail({
    firstName: String(booking.groupContact?.firstName || "there"),
    bookingReference: reference,
    packageName: String(booking.packageTitle || pkg?.title || booking.packageSlug || booking.packageId || "Tour Package"),
    paymentName: String(payment.paymentName || payment.label || matchedSchedule?.label || "Verified Payment"),
    paymentAmount: formatPeso(paymentAmount),
    paymentMethod: String(payment.method || "To be verified"),
    paymentDate: payment.paymentDate ? formatDate(String(payment.paymentDate)) : formatDate(new Date().toISOString()),
    totalAmount: formatPeso(totalAmount),
    totalPaid: formatPeso(amountPaid),
    remainingBalance: formatPeso(remainingBalance),
    bookingUrl,
  }, {
    recipient,
    subject: `${emailTemplateSubjects.BOOKING_CONFIRMED} - ${reference}`,
    relatedEntityType: "booking",
    relatedEntityId: bookingId,
    relatedReference: reference,
    metadata: {
      paymentId: String(payment.id || ""),
      paymentScheduleId: String(payment.paymentScheduleId || payment.scheduleItemId || ""),
      bookingUrl,
    },
  }).catch((error) => ({
    ok: false as const,
    error: error instanceof Error ? error.message : "Unable to send booking confirmation email.",
    logId: undefined,
  }));

  return result.ok
    ? { attempted: true, sent: true, logId: result.logId, resendEmailId: result.resendEmailId }
    : { attempted: true, sent: false, reason: result.error, logId: result.logId };
}

async function sendSubsequentPaymentConfirmedNotification({
  request,
  bookingId,
  booking,
  payment,
  paymentSchedule,
  amountPaid,
  totalAmount,
}: {
  request: NextRequest;
  bookingId: string;
  booking: FirebaseFirestore.DocumentData;
  payment: FirebaseFirestore.DocumentData;
  paymentSchedule: Array<{ id?: string; label?: string; amount?: number; dueDate?: string; status?: string }>;
  amountPaid: number;
  totalAmount: number;
}) {
  const recipient = String(booking.groupContact?.emailAddress || "").trim();
  if (!validEmail(recipient)) return { attempted: false, sent: false, reason: "missing_recipient" };

  const reference = String(booking.reference || payment.bookingReference || bookingId);
  const remainingBalance = Math.max(0, totalAmount - amountPaid);
  const nextPayment = paymentSchedule.find((item) =>
    !["cancelled", "deleted", "verified", "paid", "for_verification"].includes(normalizedStatus(item.status))
  );
  const isFullyPaid = Math.round(remainingBalance * 100) <= 0;
  const bookingUrl = publicAppUrl(`/dashboard/bookings/${encodeURIComponent(reference)}`, request);

  const result = await sendSubsequentPaymentEmail({
    firstName: String(booking.groupContact?.firstName || "there"),
    bookingReference: reference,
    paymentName: String(payment.paymentName || payment.label || "Verified Payment"),
    paymentAmount: formatPeso(numberValue(payment.amountSubmitted || payment.amountExpected)),
    paymentMethod: String(payment.method || "To be verified"),
    paymentDate: payment.paymentDate ? formatDate(String(payment.paymentDate)) : formatDate(new Date().toISOString()),
    totalAmount: formatPeso(totalAmount),
    totalPaid: formatPeso(amountPaid),
    remainingBalance: formatPeso(remainingBalance),
    bookingUrl,
    isFullyPaid,
    hasNextPayment: Boolean(nextPayment && !isFullyPaid),
    ...(nextPayment && !isFullyPaid ? {
      nextPaymentName: String(nextPayment.label || "Scheduled Payment"),
      nextPaymentAmount: formatPeso(numberValue(nextPayment.amount)),
      nextPaymentDueDate: nextPayment.dueDate ? formatDate(String(nextPayment.dueDate)) : "To be advised",
    } : {}),
  }, {
    recipient,
    subject: `${emailTemplateSubjects.SUBSEQUENT_PAYMENT_REQUEST} - ${reference}`,
    relatedEntityType: "payment",
    relatedEntityId: String(payment.id || ""),
    relatedReference: reference,
    metadata: {
      bookingId,
      paymentId: String(payment.id || ""),
      paymentScheduleId: String(payment.paymentScheduleId || payment.scheduleItemId || ""),
      bookingUrl,
      isFullyPaid,
      hasNextPayment: Boolean(nextPayment && !isFullyPaid),
    },
  }).catch((error) => ({
    ok: false as const,
    error: error instanceof Error ? error.message : "Unable to send subsequent payment confirmation email.",
    logId: undefined,
  }));

  return result.ok
    ? { attempted: true, sent: true, logId: result.logId, resendEmailId: result.resendEmailId }
    : { attempted: true, sent: false, reason: result.error, logId: result.logId };
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

  let emailResult: Awaited<ReturnType<typeof sendBookingConfirmedNotification>> | null = null;

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
      const bookingStatus = derivedBookingStatus(booking.status, paymentSchedule);

      await bookingRef.set({
        paymentSchedule,
        totalAmount,
        paymentStatus: derivedPaymentStatus(paymentSchedule),
        status: bookingStatus,
        amountPaid,
        balance: Math.max(0, totalAmount - amountPaid),
        latestPaymentId: params.paymentId,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      if (status === "verified") {
        const verifiedPayment = { ...payment, id: params.paymentId, status };
        const initialPayment = isInitialPayment(booking, verifiedPayment, params.paymentId, paymentSchedule);
        const emailType = initialPayment ? "BOOKING_CONFIRMED" : "SUBSEQUENT_PAYMENT_REQUEST";
        const shouldSend = initialPayment
          ? booking.status !== "CONFIRMED" && bookingStatus === "CONFIRMED"
          : true;

        if (shouldSend && await claimVerificationEmail(paymentRef, emailType)) {
          emailResult = initialPayment
            ? await sendBookingConfirmedNotification({
              request,
              bookingId: String(payment.bookingId),
              booking,
              payment: verifiedPayment,
              paymentSchedule,
              amountPaid,
              totalAmount,
            })
            : await sendSubsequentPaymentConfirmedNotification({
              request,
              bookingId: String(payment.bookingId),
              booking,
              payment: verifiedPayment,
              paymentSchedule,
              amountPaid,
              totalAmount,
            });

          await paymentRef.set({
            verificationEmailSentAt: emailResult.sent ? FieldValue.serverTimestamp() : null,
            verificationEmailLogId: emailResult.logId || "",
            verificationEmailError: emailResult.sent ? "" : emailResult.reason || "Unable to send verification email.",
          }, { merge: true });
        }
      }
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

  return NextResponse.json({
    payment: serializePayment(params.paymentId, { ...payment, status, updatedAt: new Date().toISOString() }),
    email: emailResult,
  });
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
        totalAmount,
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
