import { NextRequest, NextResponse } from "next/server";
import { transactionalEmailTypes, type TransactionalEmailType } from "@/lib/email-types";
import { publicAppUrl } from "@/lib/public-url";
import {
  BookingConfirmedEmail,
  BookingReceivedEmail,
  DocumentRequestEmail,
  PaymentConfirmedEmail,
  PaymentRequestEmail,
  emailTemplateSubjects,
} from "@/lib/email-templates";
import {
  sendBookingConfirmedEmail,
  sendBookingReceivedEmail,
  sendDocumentRequestEmail,
  sendPaymentRequestEmail,
  sendSubsequentPaymentEmail,
} from "@/lib/resend-template-registry";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "Email test sending is disabled." }, { status: 403 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

function testSendingEnabled() {
  return process.env.NODE_ENV === "development" || process.env.ENABLE_EMAIL_TEST_SEND === "true";
}

function appUrl(request: NextRequest, path = "") {
  return publicAppUrl(path, request);
}

function sampleHtml(request: NextRequest, emailType: TransactionalEmailType) {
  if (emailType === "BOOKING_RECEIVED") {
    return BookingReceivedEmail({
      firstName: "Juan",
      bookingReference: "VIAJE-TEST-001",
      packageName: "Japan Autumn Tour",
      departureDate: "October 12, 2026",
      guestCount: 2,
      totalAmount: "PHP 138,000.00",
      paymentAmount: "PHP 69,000.00",
      remainingBalance: "PHP 69,000.00",
      paymentMethod: "Bank Transfer",
      itineraryContent: "Tokyo, Mt. Fuji, Osaka",
      bookingUrl: appUrl(request, "/dashboard/bookings/VIAJE-TEST-001"),
    });
  }

  if (emailType === "BOOKING_CONFIRMED") {
    return BookingConfirmedEmail({
      firstName: "Juan",
      bookingReference: "VIAJE-TEST-001",
      packageName: "Japan Autumn Tour",
      paymentName: "Downpayment",
      paymentAmount: "PHP 69,000.00",
      paymentMethod: "Bank Transfer",
      paymentDate: "September 11, 2026",
      totalAmount: "PHP 138,000.00",
      totalPaid: "PHP 69,000.00",
      remainingBalance: "PHP 69,000.00",
      bookingUrl: appUrl(request, "/dashboard/bookings/VIAJE-TEST-001"),
    });
  }

  if (emailType === "DOCUMENT_REQUEST") {
    return DocumentRequestEmail({
      clientName: "Juan Dela Cruz",
      documentBinReference: "VDOC-TEST-001",
      purpose: "Tour Package",
      documentRequirements: ["Passport", "1x1 Picture", "Birth Certificate"],
      documentBinUrl: appUrl(request, "/documents/sample-token"),
    });
  }

  if (emailType === "PAYMENT_REQUEST") {
    return PaymentRequestEmail({
      firstName: "Juan",
      bookingReference: "VIAJE-TEST-001",
      packageName: "Japan Autumn Tour",
      paymentName: "Remaining Balance",
      amountDue: "PHP 69,000.00",
      dueDate: "October 1, 2026",
      paymentUrl: appUrl(request, "/book/VIAJE-TEST-001/payment"),
    });
  }

  return PaymentConfirmedEmail({
    firstName: "Juan",
    bookingReference: "VIAJE-TEST-001",
    paymentName: "Remaining Balance",
    paymentAmount: "PHP 69,000.00",
    paymentMethod: "Bank Transfer",
    paymentDate: "September 11, 2026",
    totalAmount: "PHP 138,000.00",
    totalPaid: "PHP 138,000.00",
    remainingBalance: "PHP 0.00",
    bookingUrl: appUrl(request, "/dashboard/bookings/VIAJE-TEST-001"),
    isFullyPaid: true,
  });
}

function sendSampleTemplate(request: NextRequest, emailType: TransactionalEmailType, recipient: string) {
  const options = {
    recipient,
    subject: `[TEST] ${emailTemplateSubjects[emailType]}`,
    relatedEntityType: "test" as const,
    relatedEntityId: "VIAJE-TEST-001",
    relatedReference: "VIAJE-TEST-001",
    metadata: { testSend: true },
  };

  if (emailType === "BOOKING_RECEIVED") {
    return sendBookingReceivedEmail({
      firstName: "Juan",
      bookingReference: "VIAJE-TEST-001",
      packageName: "Japan Autumn Tour",
      departureDate: "October 12, 2026",
      guestCount: 2,
      totalAmount: "PHP 138,000.00",
      paymentAmount: "PHP 69,000.00",
      remainingBalance: "PHP 69,000.00",
      paymentMethod: "Bank Transfer",
      itineraryContent: "Tokyo, Mt. Fuji, Osaka",
      bookingUrl: appUrl(request, "/dashboard/bookings/VIAJE-TEST-001"),
    }, options);
  }

  if (emailType === "BOOKING_CONFIRMED") {
    return sendBookingConfirmedEmail({
      firstName: "Juan",
      bookingReference: "VIAJE-TEST-001",
      packageName: "Japan Autumn Tour",
      paymentName: "Downpayment",
      paymentAmount: "PHP 69,000.00",
      paymentMethod: "Bank Transfer",
      paymentDate: "September 11, 2026",
      totalAmount: "PHP 138,000.00",
      totalPaid: "PHP 69,000.00",
      remainingBalance: "PHP 69,000.00",
      bookingUrl: appUrl(request, "/dashboard/bookings/VIAJE-TEST-001"),
    }, options);
  }

  if (emailType === "DOCUMENT_REQUEST") {
    return sendDocumentRequestEmail({
      clientName: "Juan Dela Cruz",
      documentBinReference: "VDOC-TEST-001",
      purpose: "Tour Package",
      documentRequirements: ["Passport", "1x1 Picture", "Birth Certificate"],
      documentBinUrl: appUrl(request, "/documents/sample-token"),
    }, options);
  }

  if (emailType === "PAYMENT_REQUEST") {
    return sendPaymentRequestEmail({
      firstName: "Juan",
      bookingReference: "VIAJE-TEST-001",
      packageName: "Japan Autumn Tour",
      paymentName: "Remaining Balance",
      amountDue: "PHP 69,000.00",
      dueDate: "October 1, 2026",
      paymentUrl: appUrl(request, "/book/VIAJE-TEST-001/payment"),
    }, options);
  }

  return sendSubsequentPaymentEmail({
    firstName: "Juan",
    bookingReference: "VIAJE-TEST-001",
    paymentName: "Remaining Balance",
    paymentAmount: "PHP 69,000.00",
    paymentMethod: "Bank Transfer",
    paymentDate: "September 11, 2026",
    totalAmount: "PHP 138,000.00",
    totalPaid: "PHP 138,000.00",
    remainingBalance: "PHP 0.00",
    bookingUrl: appUrl(request, "/dashboard/bookings/VIAJE-TEST-001"),
    isFullyPaid: true,
  }, options);
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();
  if (!testSendingEnabled()) return forbidden();

  const body = await request.json().catch(() => ({}));
  const recipient = String(body.recipient || "").trim();
  const emailType = String(body.emailType || "BOOKING_RECEIVED") as TransactionalEmailType;

  if (!transactionalEmailTypes.includes(emailType)) {
    return NextResponse.json({ error: "Invalid email type." }, { status: 400 });
  }

  const result = body.useLocalHtml === true
    ? await import("@/lib/email-service").then(({ sendEmail }) => sendEmail({
        recipient,
        emailType,
        subject: `[TEST] ${emailTemplateSubjects[emailType]}`,
        html: sampleHtml(request, emailType),
        relatedEntityType: "test",
        relatedEntityId: "VIAJE-TEST-001",
        relatedReference: "VIAJE-TEST-001",
        metadata: { testSend: true, localHtml: true },
      }))
    : await sendSampleTemplate(request, emailType, recipient);

  if (!result.ok) return NextResponse.json({ error: result.error, logId: result.logId || "" }, { status: 400 });

  return NextResponse.json(result);
}
