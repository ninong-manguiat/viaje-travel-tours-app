import { NextRequest, NextResponse } from "next/server";
import { emailTemplateSubjects } from "@/lib/email-templates";
import { publicAppUrl } from "@/lib/public-url";
import { sendPaymentRequestEmail } from "@/lib/resend-template-registry";
import { formatDate, formatPeso } from "@/lib/utils";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

function isPayableSchedule(status?: string) {
  return ["pending", "unpaid", "rejected"].includes(String(status || "pending").toLowerCase());
}

function safeSendError(message = "") {
  const normalized = message.toLowerCase();
  if (normalized.includes("api key")) return "Email service is not configured.";
  if (normalized.includes("domain") && normalized.includes("verif")) return "Email sender domain is not verified in Resend.";
  if (normalized.includes("from")) return "Email sender was rejected by Resend. Check EMAIL_FROM and sender domain verification.";
  return "Unable to send payment request email.";
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest, { params }: { params: { bookingId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const scheduleItemId = String(body?.scheduleItemId || "").trim();
  if (!scheduleItemId) return NextResponse.json({ error: "Payment schedule is required." }, { status: 400 });

  const { adminDb } = await import("@/lib/firebase-admin");
  const snapshot = await adminDb.collection("bookings").doc(params.bookingId).get();
  if (!snapshot.exists) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  const booking = snapshot.data() ?? {};
  const schedule = Array.isArray(booking.paymentSchedule) ? booking.paymentSchedule : [];
  const scheduleItem = schedule.find((item) => String(item.id || "") === scheduleItemId);
  if (!scheduleItem) return NextResponse.json({ error: "Payment schedule item not found." }, { status: 404 });
  if (!isPayableSchedule(scheduleItem.status)) {
    return NextResponse.json({ error: "Payment request can only be sent for unpaid or rejected schedules." }, { status: 400 });
  }

  const recipient = String(booking.groupContact?.emailAddress || "").trim();
  if (!emailPattern.test(recipient)) return NextResponse.json({ error: "Booking contact email is missing or invalid." }, { status: 400 });

  const reference = String(booking.reference || params.bookingId);
  const paymentUrl = publicAppUrl(`/book/${encodeURIComponent(reference)}/payment?schedules=${encodeURIComponent(scheduleItemId)}`);
  const result = await sendPaymentRequestEmail({
    firstName: String(booking.groupContact?.firstName || "there"),
    bookingReference: reference,
    packageName: String(booking.packageTitle || booking.packageSlug || booking.packageId || "Tour Package"),
    paymentName: String(scheduleItem.label || "Scheduled Payment"),
    amountDue: formatPeso(Number(scheduleItem.amount || 0)),
    dueDate: scheduleItem.dueDate ? formatDate(String(scheduleItem.dueDate)) : "To be advised",
    paymentUrl,
  }, {
    recipient,
    subject: `${emailTemplateSubjects.PAYMENT_REQUEST} - ${reference}`,
    relatedEntityType: "payment",
    relatedEntityId: scheduleItemId,
    relatedReference: reference,
    metadata: {
      bookingId: params.bookingId,
      paymentScheduleId: scheduleItemId,
      paymentUrl,
      amountDue: Number(scheduleItem.amount || 0),
    },
  });

  if (!result.ok) return NextResponse.json({ error: safeSendError(result.error), logId: result.logId || "" }, { status: 500 });
  return NextResponse.json({ ok: true, resendEmailId: result.resendEmailId, logId: result.logId, paymentUrl });
}
