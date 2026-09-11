import { NextRequest, NextResponse } from "next/server";
import { emailTemplateSubjects } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email-service";
import { getPackageById } from "@/lib/package-data";
import { formatDate, formatPeso } from "@/lib/utils";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const bookingReceivedTemplateAlias = "booking-received";

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

function appUrl(path = "") {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
  if (!baseUrl) return "";
  return `${baseUrl}/${path.replace(/^\/+/, "")}`;
}

function itineraryContent(pkg: Awaited<ReturnType<typeof getPackageById>>) {
  if (!pkg?.itinerary?.length) return "";

  return pkg.itinerary
    .map((item) => {
      const title = [item.day, item.name].filter(Boolean).join(": ");
      const activities = item.activities.map((activity) => activity.activity).filter(Boolean).join(", ");
      return [title, activities].filter(Boolean).join(" - ");
    })
    .filter(Boolean)
    .join("; ");
}

function initialPaymentAmount(booking: FirebaseFirestore.DocumentData, schedule: Array<{ id?: string; amount?: number; status?: string }>) {
  const submittedAmount = numberValue(booking.paymentInfo?.amountSubmitted);
  if (submittedAmount > 0) return submittedAmount;

  const initialPayment = schedule.find((item) => item.id === "downpayment") ?? schedule.find((item) => item.id === "full-payment");
  return numberValue(initialPayment?.amount ?? booking.amountPaid);
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

  const pkg = booking.packageId ? await getPackageById(String(booking.packageId)) : null;
  const schedule = Array.isArray(booking.paymentSchedule) ? booking.paymentSchedule : [];
  const reference = String(booking.reference || params.bookingId);
  const totalAmount = numberValue(booking.totalAmount ?? booking.bookingSelections?.finalAmount);
  const paymentAmount = initialPaymentAmount(booking, schedule);
  const remainingBalance = numberValue(booking.balance ?? Math.max(0, totalAmount - paymentAmount));
  const departureDate = String(booking.bookingSelections?.selectedDeparture?.startDate || booking.departureDate || "");
  const bookingUrl = appUrl(`/dashboard/bookings/${encodeURIComponent(reference)}`);

  const result = await sendEmail({
    recipient,
    emailType: "BOOKING_RECEIVED",
    subject: `${emailTemplateSubjects.BOOKING_RECEIVED} - ${reference}`,
    template: {
      id: bookingReceivedTemplateAlias,
      variables: {
        firstName: String(booking.groupContact?.firstName || "there"),
        bookingReference: reference,
        packageName: String(booking.packageTitle || pkg?.title || booking.packageSlug || booking.packageId || "Tour Package"),
        departureDate: dateLabel(departureDate),
        guestCount: Array.isArray(booking.guests) ? booking.guests.length : numberValue(booking.bookingSelections?.pax),
        totalAmount: formatPeso(totalAmount),
        paymentAmount: formatPeso(paymentAmount),
        remainingBalance: formatPeso(remainingBalance),
        paymentMethod: String(booking.paymentInfo?.method || "To be verified"),
        itineraryContent: itineraryContent(pkg),
        bookingUrl,
      },
    },
    relatedEntityType: "booking",
    relatedEntityId: params.bookingId,
    relatedReference: reference,
  });

  if (!result.ok) {
    return NextResponse.json({ error: safeSendError(result.error) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, resendEmailId: result.resendEmailId, logId: result.logId });
}
