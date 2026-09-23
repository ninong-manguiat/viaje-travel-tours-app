import "server-only";

import { join } from "node:path";
import { SimplePdf, type PdfRow } from "@/lib/pdf/simple-pdf";
import { getPackageById } from "@/lib/package-data";
import { normalizePaymentMethod } from "@/lib/payment-methods";
import { getQuotationWithItems, type Quotation } from "@/lib/quotations";
import { defaultWebsiteContent, mergeWebsiteContent } from "@/lib/website-content";
import { formatDate } from "@/lib/utils";

type FirestoreData = FirebaseFirestore.DocumentData;

type PaymentLog = {
  id: string;
  paymentScheduleId: string;
  paymentName: string;
  method: string;
  paymentMethodId: string;
  paymentMethodReferenceNumber: string;
  referenceNumber: string;
  amountExpected: number;
  amountSubmitted: number;
  receiptUrl: string;
  paymentDate: string;
  status: string;
  createdAt: string;
};

function timestampValue(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return value.toDate().toISOString();
  if (value && typeof value === "object" && "seconds" in value && typeof value.seconds === "number") return new Date(value.seconds * 1000).toISOString();
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function safeDate(value: unknown) {
  const text = String(value || "");
  if (!text) return "N/A";
  try {
    return formatDate(text);
  } catch {
    return text;
  }
}

function formatPdfPeso(value: number) {
  return `PHP ${new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(value)}`;
}

function fullName(input: Record<string, unknown> | undefined, fallback = "N/A") {
  const parts = [input?.firstName, input?.middleName, input?.lastName].map((value) => String(value ?? "").trim()).filter(Boolean);
  return parts.join(" ") || fallback;
}

function paymentStatusLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function downloadResponse(buffer: Buffer, filename: string) {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
      "Cache-Control": "no-store",
    },
  });
}

async function footerLines() {
  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    const snapshot = await adminDb.collection("websiteContent").doc("homepage").get();
    const content = snapshot.exists ? mergeWebsiteContent(snapshot.data()) : defaultWebsiteContent;
    return [
      content.aboutUs.direction,
      [content.aboutUs.contactNumber, content.aboutUs.landlineNumber, content.aboutUs.facebook].filter(Boolean).join(" | "),
    ].filter(Boolean);
  } catch {
    return [
      defaultWebsiteContent.aboutUs.direction,
      [defaultWebsiteContent.aboutUs.contactNumber, defaultWebsiteContent.aboutUs.landlineNumber, defaultWebsiteContent.aboutUs.facebook].filter(Boolean).join(" | "),
    ];
  }
}

async function createDocument(title: string) {
  return new SimplePdf({
    title,
    logoPath: join(process.cwd(), "public/brand/viaje-logo.png"),
    footerLines: await footerLines(),
  });
}

function serializePaymentLog(id: string, data: FirestoreData): PaymentLog {
  return {
    id,
    paymentScheduleId: String(data.paymentScheduleId || data.scheduleItemId || ""),
    paymentName: String(data.paymentName || data.label || ""),
    method: String(data.method || ""),
    paymentMethodId: String(data.paymentMethodId || ""),
    paymentMethodReferenceNumber: String(data.paymentMethodReferenceNumber || ""),
    referenceNumber: String(data.referenceNumber || ""),
    amountExpected: numberValue(data.amountExpected),
    amountSubmitted: numberValue(data.amountSubmitted),
    receiptUrl: String(data.receiptUrl || ""),
    paymentDate: String(data.paymentDate || ""),
    status: String(data.status || ""),
    createdAt: timestampValue(data.createdAt),
  };
}

async function loadBooking(bookingId: string) {
  const { adminDb } = await import("@/lib/firebase-admin");
  const snapshot = await adminDb.collection("bookings").doc(bookingId).get();
  if (!snapshot.exists) return null;
  const paymentSnapshot = await adminDb.collection("payments").where("bookingId", "==", bookingId).get();
  const payments = paymentSnapshot.docs.map((doc) => serializePaymentLog(doc.id, doc.data()));
  return { id: snapshot.id, data: snapshot.data() ?? {}, payments };
}

function totalPaidFromSchedule(schedule: Array<{ amount?: number; status?: string }>) {
  return schedule.reduce((sum, item) => ["verified", "paid"].includes(String(item.status || "").toLowerCase()) ? sum + numberValue(item.amount) : sum, 0);
}

function paymentForReceipt(booking: FirestoreData, payments: PaymentLog[]) {
  const verified = payments
    .filter((payment) => ["verified", "paid"].includes(payment.status.toLowerCase()))
    .sort((a, b) => String(b.createdAt || b.paymentDate).localeCompare(String(a.createdAt || a.paymentDate)));
  if (verified[0]) return verified[0];

  const amount = numberValue(booking.paymentInfo?.amountSubmitted || booking.amountPaid);
  if (amount > 0) {
    return {
      id: "initial-payment",
      paymentScheduleId: "",
      paymentName: String(booking.paymentType || "Initial Payment"),
      method: String(booking.paymentInfo?.method || ""),
      paymentMethodId: String(booking.paymentInfo?.method || ""),
      paymentMethodReferenceNumber: String(booking.paymentInfo?.paymentMethodReferenceNumber || ""),
      referenceNumber: String(booking.paymentInfo?.transactionReferenceNumber || ""),
      amountExpected: amount,
      amountSubmitted: amount,
      receiptUrl: String(booking.paymentInfo?.receiptUrl || ""),
      paymentDate: String(booking.paymentInfo?.paymentDate || ""),
      status: String(booking.paymentStatus || ""),
      createdAt: timestampValue(booking.createdAt),
    };
  }

  return payments[0] ?? null;
}

async function paymentMethodDetails(payment: PaymentLog | null) {
  if (!payment?.paymentMethodId) return null;
  const { adminDb } = await import("@/lib/firebase-admin");
  const snapshot = await adminDb.collection("paymentMethods").doc(payment.paymentMethodId).get().catch(() => null);
  if (!snapshot?.exists) return null;
  return normalizePaymentMethod({ id: snapshot.id, ...snapshot.data() });
}

export async function quotationPdfResponse(quotationId: string) {
  const quotation = await getQuotationWithItems(quotationId);
  if (!quotation) return null;
  const pdf = await createDocument("Quotation");

  pdf.section("Quotation Information");
  pdf.keyValues([
    ["Reference Number", quotation.referenceNumber],
    ["Date", safeDate(quotation.updatedAt || quotation.createdAt)],
    ["Status", quotation.status],
    ["Payment Status", quotation.paymentStatus],
  ], 2);

  pdf.section("Customer Information");
  pdf.keyValues([
    ["Customer / Contact Person", quotation.clientName],
    ["Email", quotation.email],
    ["Contact Number", quotation.contactNumber],
  ], 3);

  pdf.section("Quotation Details");
  const detailRows: PdfRow[] = quotation.items.map((item) => [
    item.itemName,
    item.remarks,
    formatPdfPeso(item.amount),
  ]);
  pdf.table(["Service", "Remarks", "Amount"], detailRows, [1.2, 2.5, 0.9]);
  pdf.keyValues([["Total Amount", formatPdfPeso(quotation.totalAmount)]], 1);

  return downloadResponse(pdf.toBuffer(), `Quotation-${quotation.referenceNumber || quotation.id}.pdf`);
}

function bookingInfoRows(bookingId: string, booking: FirestoreData): Array<[string, string | number | undefined]> {
  const departure = booking.bookingSelections?.selectedDeparture;
  return [
    ["Booking Reference", String(booking.reference || bookingId)],
    ["Booking Date", safeDate(booking.createdAt)],
    ["Booking Status", String(booking.status || "N/A")],
    ["Contact Person", fullName(booking.groupContact)],
    ["Contact Number", String(booking.groupContact?.mobileNumber || "N/A")],
    ["Email", String(booking.groupContact?.emailAddress || "N/A")],
    ["Package / Tour", String(booking.packageTitle || booking.packageSlug || booking.packageId || "N/A")],
    ["Travel Date", departure?.startDate ? `${safeDate(departure.startDate)} - ${safeDate(departure.endDate)}` : "N/A"],
    ["Number of Guests", Array.isArray(booking.guests) ? booking.guests.length : numberValue(booking.bookingSelections?.pax)],
  ];
}

export async function itineraryPdfResponse(bookingId: string) {
  const current = await loadBooking(bookingId);
  if (!current) return null;
  const { data: booking } = current;
  const pkg = booking.packageId ? await getPackageById(String(booking.packageId)) : null;
  const pdf = await createDocument("Itinerary");
  const totalAmount = numberValue(booking.totalAmount ?? booking.bookingSelections?.finalAmount);

  pdf.section("Booking Information");
  pdf.keyValues(bookingInfoRows(bookingId, booking), 3);

  pdf.section("Guest Information");
  const guests = Array.isArray(booking.guests) ? booking.guests : [];
  pdf.table(["Guest", "Nationality", "Passport", "PWD"], guests.map((guest, index) => [
    fullName(guest, `Guest ${index + 1}`),
    String(guest?.nationality || "N/A"),
    String(guest?.passportNumber || "N/A"),
    guest?.isPwd ? "Yes" : "No",
  ]), [1.8, 1, 1, 0.7]);

  pdf.section("Itinerary");
  if (pkg?.itinerary?.length) {
    pkg.itinerary.forEach((item) => {
      pdf.paragraph([item.day, item.name].filter(Boolean).join(" - "), 10);
      const activities = item.activities.map((activity) => activity.activity).filter(Boolean).join("; ");
      if (activities) pdf.paragraph(activities, 8.8);
    });
  } else {
    pdf.paragraph("Itinerary details are not available for this package yet.");
  }

  pdf.section("Booking Amount");
  pdf.keyValues([
    ["Package Amount", formatPdfPeso(numberValue(booking.bookingSelections?.baseAmount))],
    ["Add-ons", formatPdfPeso(numberValue(booking.bookingSelections?.addonAmount))],
    ["Other Charges", formatPdfPeso(numberValue(booking.bookingSelections?.departureAdditionalAmount))],
    ["Total Booking Amount", formatPdfPeso(totalAmount)],
  ], 2);

  return downloadResponse(pdf.toBuffer(), `Itinerary-${String(booking.reference || bookingId)}.pdf`);
}

export async function acknowledgementReceiptPdfResponse(bookingId: string) {
  const current = await loadBooking(bookingId);
  if (!current) return null;
  const { data: booking, payments } = current;
  const pdf = await createDocument("Acknowledgement Receipt");
  const totalAmount = numberValue(booking.totalAmount ?? booking.bookingSelections?.finalAmount);
  const schedule = Array.isArray(booking.paymentSchedule) ? booking.paymentSchedule : [];
  const payment = paymentForReceipt(booking, payments);
  const method = await paymentMethodDetails(payment);
  const amountReceived = numberValue(payment?.amountSubmitted ?? payment?.amountExpected ?? 0);
  const paid = payments.length
    ? payments.filter((item) => ["verified", "paid"].includes(item.status.toLowerCase())).reduce((sum, item) => sum + numberValue(item.amountSubmitted || item.amountExpected), 0)
    : totalPaidFromSchedule(schedule);
  const totalPaid = Math.max(paid, ["verified", "paid"].includes(String(payment?.status || "").toLowerCase()) ? amountReceived : numberValue(booking.amountPaid));
  const remainingBalance = Math.max(0, totalAmount - totalPaid);

  pdf.section("Receipt Information");
  pdf.keyValues([
    ["Booking Reference", String(booking.reference || bookingId)],
    ["Receipt / Transaction Date", safeDate(payment?.paymentDate || payment?.createdAt || booking.updatedAt || booking.createdAt)],
    ["Customer / Contact Person", fullName(booking.groupContact)],
    ["Package / Itinerary", String(booking.packageTitle || booking.packageSlug || booking.packageId || "N/A")],
    ["Payment Status", paymentStatusLabel(String(payment?.status || booking.paymentStatus || "N/A"))],
    ["Payment Reference", String(payment?.referenceNumber || booking.paymentInfo?.transactionReferenceNumber || "N/A")],
  ], 2);

  pdf.section("Payment Received");
  pdf.keyValues([
    ["Payment Method", method?.bank || payment?.method || String(booking.paymentInfo?.method || "N/A")],
    ["Account Name", method?.accountName || "N/A"],
    ["Account Number", method?.referenceNumber || payment?.paymentMethodReferenceNumber || String(booking.paymentInfo?.paymentMethodReferenceNumber || "N/A")],
    ["Amount Received", formatPdfPeso(amountReceived)],
    ["Total Booking Amount", formatPdfPeso(totalAmount)],
    ["Remaining Balance", formatPdfPeso(remainingBalance)],
  ], 2);

  if (payment?.receiptUrl) {
    pdf.section("Proof Information");
    pdf.paragraph(`Proof of payment file: ${payment.receiptUrl}`, 8.5);
  }

  pdf.signatureBlock();
  return downloadResponse(pdf.toBuffer(), `Acknowledgement-Receipt-${String(booking.reference || bookingId)}.pdf`);
}

export type { Quotation };
