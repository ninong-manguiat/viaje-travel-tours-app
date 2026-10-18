import { NextRequest, NextResponse } from "next/server";
import { emailTemplateSubjects } from "@/lib/email-templates";
import { getPackageById } from "@/lib/package-data";
import { publicAppUrl } from "@/lib/public-url";
import { sendBookingConfirmedEmail, sendBookingReceivedEmail } from "@/lib/resend-template-registry";
import { formatDate, formatPeso } from "@/lib/utils";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

function numberValue(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function dateLabel(value?: string) {
  if (!value) return "To be advised";
  return formatDate(value);
}

function initialPaymentAmount(booking: FirebaseFirestore.DocumentData, schedule: Array<{ id?: string; amount?: number; status?: string }>) {
  const submittedAmount = numberValue(booking.paymentInfo?.amountSubmitted);
  if (submittedAmount > 0) return submittedAmount;

  const initialPayment = schedule.find((item) => item.id === "downpayment") ?? schedule.find((item) => item.id === "full-payment");
  return numberValue(initialPayment?.amount ?? booking.amountPaid);
}

function normalizedStatus(value: unknown) {
  return String(value || "").toLowerCase();
}

function paymentTimestamp(value: unknown) {
  if (value instanceof Date) return value.getTime();
  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") return value.toMillis();
  if (value && typeof value === "object" && "seconds" in value && typeof value.seconds === "number") return value.seconds * 1000;
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeSendError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("resend_api_key")) return "Resend API key is not configured on the server.";
  if (normalized.includes("email_from")) return "Email sender is not configured on the server.";
  if (normalized.includes("domain") && normalized.includes("verif")) return "Email sender domain is not verified in Resend.";
  if (normalized.includes("from")) return "Email sender was rejected by Resend. Check EMAIL_FROM and sender domain verification.";
  if (normalized.includes("api key") || normalized.includes("unauthorized")) return "Resend API key was rejected.";
  return "Unable to send confirmation email.";
}

export async function POST(request: NextRequest, { params }: { params: { bookingId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const { adminDb } = await import("@/lib/firebase-admin");
  const snapshot = await adminDb.collection("bookings").doc(params.bookingId).get();
  if (!snapshot.exists) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  const booking = snapshot.data() ?? {};
  const recipient = String(booking.groupContact?.emailAddress || "").trim();
  if (!emailPattern.test(recipient)) {
    return NextResponse.json({ error: "Booking contact email is missing or invalid." }, { status: 400 });
  }

  const [pkg, paymentSnapshot] = await Promise.all([
    booking.packageId ? getPackageById(String(booking.packageId)) : Promise.resolve(null),
    adminDb.collection("payments").where("bookingId", "==", params.bookingId).get(),
  ]);
  const schedule = Array.isArray(booking.paymentSchedule) ? booking.paymentSchedule : [];
  const reference = String(booking.reference || params.bookingId);
  const totalAmount = numberValue(booking.totalAmount ?? booking.bookingSelections?.finalAmount);
  const verifiedPayments: FirebaseFirestore.DocumentData[] = paymentSnapshot.docs
    .map((doc): FirebaseFirestore.DocumentData => ({ id: doc.id, ...(doc.data() as FirebaseFirestore.DocumentData) }))
    .filter((payment) => ["verified", "paid"].includes(normalizedStatus(payment.status)))
    .sort((left, right) => paymentTimestamp(right.updatedAt || right.createdAt) - paymentTimestamp(left.updatedAt || left.createdAt));
  const latestVerifiedPayment = verifiedPayments[0];
  const totalPaid = verifiedPayments.reduce((sum, payment) => sum + numberValue(payment.amountSubmitted || payment.amountExpected), 0);
  const paymentAmount = latestVerifiedPayment
    ? numberValue(latestVerifiedPayment.amountSubmitted || latestVerifiedPayment.amountExpected)
    : initialPaymentAmount(booking, schedule);
  const remainingBalance = Math.max(0, totalAmount - totalPaid);
  const departureDate = String(booking.bookingSelections?.selectedDeparture?.startDate || booking.departureDate || "");
  const bookingUrl = publicAppUrl(`/dashboard/bookings/${encodeURIComponent(reference)}`, request);

  const result = booking.status === "CONFIRMED"
    ? await sendBookingConfirmedEmail({
      firstName: String(booking.groupContact?.firstName || "there"),
      bookingReference: reference,
      packageName: String(booking.packageTitle || pkg?.title || booking.packageSlug || booking.packageId || "Tour Package"),
      paymentName: String(latestVerifiedPayment?.paymentName || latestVerifiedPayment?.label || "Verified Payment"),
      paymentAmount: formatPeso(paymentAmount),
      paymentMethod: String(latestVerifiedPayment?.method || booking.paymentInfo?.method || "To be verified"),
      paymentDate: latestVerifiedPayment?.paymentDate ? formatDate(String(latestVerifiedPayment.paymentDate)) : formatDate(new Date().toISOString()),
      totalAmount: formatPeso(totalAmount),
      totalPaid: formatPeso(totalPaid),
      remainingBalance: formatPeso(remainingBalance),
      bookingUrl,
    }, {
      recipient,
      subject: `${emailTemplateSubjects.BOOKING_CONFIRMED} - ${reference}`,
      relatedEntityType: "booking",
      relatedEntityId: params.bookingId,
      relatedReference: reference,
    })
    : await sendBookingReceivedEmail({
      firstName: String(booking.groupContact?.firstName || "there"),
      bookingReference: reference,
      packageName: String(booking.packageTitle || pkg?.title || booking.packageSlug || booking.packageId || "Tour Package"),
      departureDate: dateLabel(departureDate),
      guestCount: Array.isArray(booking.guests) ? booking.guests.length : numberValue(booking.bookingSelections?.pax),
      totalAmount: formatPeso(totalAmount),
      paymentAmount: formatPeso(paymentAmount),
      remainingBalance: formatPeso(remainingBalance),
      paymentMethod: String(booking.paymentInfo?.method || "To be verified"),
      bookingUrl,
    }, {
      recipient,
      subject: `${emailTemplateSubjects.BOOKING_RECEIVED} - ${reference}`,
      relatedEntityType: "booking",
      relatedEntityId: params.bookingId,
      relatedReference: reference,
    });

  if (!result.ok) {
    return NextResponse.json({ error: safeSendError(result.error) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, resendEmailId: result.resendEmailId, logId: result.logId });
}
