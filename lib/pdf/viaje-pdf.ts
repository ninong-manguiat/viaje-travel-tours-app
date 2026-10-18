import "server-only";

import { join } from "node:path";
import { SimplePdf, type PdfRow } from "@/lib/pdf/simple-pdf";
import { getPackageById } from "@/lib/package-data";
import { normalizePaymentMethod } from "@/lib/payment-methods";
import { getQuotationWithItems, quotationItemDetail, type Quotation } from "@/lib/quotations";
import { defaultWebsiteContent, mergeWebsiteContent } from "@/lib/website-content";
import { formatDate } from "@/lib/utils";

type FirestoreData = FirebaseFirestore.DocumentData;
const OFFICIAL_WEBSITE_LABEL = "viajetravelandtours.com";
const OFFICIAL_WEBSITE_URL = "https://viajetravelandtours.com";
const FACEBOOK_LABEL = "https://www.facebook.com/viajewithus/";

type PaymentLog = {
  id: string;
  source: string;
  bookingId: string;
  bookingReference: string;
  quotationId: string;
  quotationReference: string;
  paymentScheduleId: string;
  paymentName: string;
  method: string;
  paymentMethodId: string;
  paymentMethodReferenceNumber: string;
  referenceNumber: string;
  currency: "PHP" | "USD";
  amountExpected: number;
  amountSubmitted: number;
  receiptUrl: string;
  paymentDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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
  if (!value) return "N/A";
  let date: Date | string | number | null = null;
  if (value instanceof Date || typeof value === "string" || typeof value === "number") date = value;
  else if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") date = value.toDate();
  else if (typeof value === "object" && "seconds" in value && typeof value.seconds === "number") date = new Date(value.seconds * 1000);
  else if (typeof value === "object" && "_seconds" in value && typeof value._seconds === "number") date = new Date(value._seconds * 1000);

  if (!date) return "N/A";
  try {
    const formatted = formatDate(date);
    return formatted === "Invalid date" ? "N/A" : formatted;
  } catch {
    return "N/A";
  }
}

function pdfText(value: unknown) {
  return String(value ?? "").replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF]/g, "").replace(/\s{2,}/g, " ").trim();
}

function formatPdfPeso(value: number) {
  return `PHP ${new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(value)}`;
}

function formatPdfBookingCurrency(value: number, currency: unknown) {
  const code = currency === "USD" ? "USD" : "PHP";
  return `${code} ${new Intl.NumberFormat(code === "USD" ? "en-US" : "en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
}

function quotationDetailText(item: Quotation["items"][number]) {
  const detail = quotationItemDetail(item);
  return [
    detail ? `${pdfText(detail.label)}: ${pdfText(detail.value)}` : "",
    item.remarks ? `Remarks: ${pdfText(item.remarks)}` : "",
  ].filter(Boolean).join("\n");
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

async function footerInfo() {
  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    const snapshot = await adminDb.collection("websiteContent").doc("homepage").get();
    const content = snapshot.exists ? mergeWebsiteContent(snapshot.data()) : defaultWebsiteContent;
    const facebookUrl = String(content.aboutUs.facebook || "").trim();
    return {
      lines: [
        content.aboutUs.direction,
        [content.aboutUs.contactNumber, content.aboutUs.landlineNumber, OFFICIAL_WEBSITE_LABEL, facebookUrl ? FACEBOOK_LABEL : ""].filter(Boolean).join(" | "),
      ].filter(Boolean),
      links: {
        websiteLabel: OFFICIAL_WEBSITE_LABEL,
        websiteUrl: OFFICIAL_WEBSITE_URL,
        facebookLabel: FACEBOOK_LABEL,
        facebookUrl,
      },
    };
  } catch {
    const facebookUrl = String(defaultWebsiteContent.aboutUs.facebook || "").trim();
    return {
      lines: [
        defaultWebsiteContent.aboutUs.direction,
        [defaultWebsiteContent.aboutUs.contactNumber, defaultWebsiteContent.aboutUs.landlineNumber, OFFICIAL_WEBSITE_LABEL, facebookUrl ? FACEBOOK_LABEL : ""].filter(Boolean).join(" | "),
      ],
      links: {
        websiteLabel: OFFICIAL_WEBSITE_LABEL,
        websiteUrl: OFFICIAL_WEBSITE_URL,
        facebookLabel: FACEBOOK_LABEL,
        facebookUrl,
      },
    };
  }
}

async function createDocument(title: string) {
  const footer = await footerInfo();
  return new SimplePdf({
    title,
    logoPath: join(process.cwd(), "public/brand/viaje-logo.png"),
    footerLines: footer.lines,
    footerLinks: footer.links,
  });
}

function serializePaymentLog(id: string, data: FirestoreData): PaymentLog {
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
    paymentMethodId: String(data.paymentMethodId || ""),
    paymentMethodReferenceNumber: String(data.paymentMethodReferenceNumber || ""),
    referenceNumber: String(data.referenceNumber || ""),
    currency: data.currency === "USD" ? "USD" : "PHP",
    amountExpected: numberValue(data.amountExpected),
    amountSubmitted: numberValue(data.amountSubmitted),
    receiptUrl: String(data.receiptUrl || ""),
    paymentDate: String(data.paymentDate || ""),
    status: String(data.status || ""),
    createdAt: timestampValue(data.createdAt),
    updatedAt: timestampValue(data.updatedAt),
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

async function loadQuotationPayments(quotationId: string) {
  const { adminDb } = await import("@/lib/firebase-admin");
  const paymentSnapshot = await adminDb.collection("payments").where("quotationId", "==", quotationId).get();
  return paymentSnapshot.docs
    .map((doc) => serializePaymentLog(doc.id, doc.data()))
    .sort((a, b) => String(b.createdAt || b.paymentDate).localeCompare(String(a.createdAt || a.paymentDate)));
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
      source: "BOOKING",
      bookingId: "",
      bookingReference: String(booking.reference || ""),
      quotationId: "",
      quotationReference: "",
      paymentScheduleId: "",
      paymentName: String(booking.paymentType || "Initial Payment"),
      method: String(booking.paymentInfo?.method || ""),
      paymentMethodId: String(booking.paymentInfo?.method || ""),
      paymentMethodReferenceNumber: String(booking.paymentInfo?.paymentMethodReferenceNumber || ""),
      referenceNumber: String(booking.paymentInfo?.transactionReferenceNumber || ""),
      currency: booking.currency === "USD" ? "USD" as const : "PHP" as const,
      amountExpected: amount,
      amountSubmitted: amount,
      receiptUrl: String(booking.paymentInfo?.receiptUrl || ""),
      paymentDate: String(booking.paymentInfo?.paymentDate || ""),
      status: String(booking.paymentStatus || ""),
      createdAt: timestampValue(booking.createdAt),
      updatedAt: timestampValue(booking.updatedAt),
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
    quotationDetailText(item),
    formatPdfPeso(item.amount),
  ]);
  pdf.table(["Service", "Additional Detail / Remarks", "Amount"], detailRows, [1.2, 2.5, 0.9], { headerLine: false, rowLines: false, rowSpacing: 7 });
  pdf.keyValues([["Total Amount", formatPdfPeso(quotation.totalAmount)]], 1);
  if (quotation.inclusions) {
    pdf.section("Inclusions");
    quotation.inclusions.split(/\r?\n/).map(pdfText).filter(Boolean).forEach((line) => pdf.bullet(line, 8.8));
  }
  if (quotation.exclusions) {
    pdf.section("Exclusions");
    quotation.exclusions.split(/\r?\n/).map(pdfText).filter(Boolean).forEach((line) => pdf.bullet(line, 8.8));
  }

  return downloadResponse(pdf.toBuffer(), `Quotation-${quotation.referenceNumber || quotation.id}.pdf`);
}

export async function quotationAcknowledgementReceiptPdfResponse(quotationId: string) {
  const quotation = await getQuotationWithItems(quotationId);
  if (!quotation) return null;
  if (quotation.status !== "FINALIZED") return "not_finalized" as const;

  const payments = await loadQuotationPayments(quotation.id);
  const verifiedPayments = payments.filter((payment) => ["verified", "paid"].includes(payment.status.toLowerCase()));
  const latestPayment = payments[0] ?? null;
  const receivedPayment = verifiedPayments[0] ?? null;
  const method = await paymentMethodDetails(receivedPayment || latestPayment);
  const amountReceived = verifiedPayments.reduce((sum, payment) => sum + numberValue(payment.amountSubmitted || payment.amountExpected), 0);
  const remainingBalance = Math.max(0, quotation.totalAmount - amountReceived);
  const pdf = await createDocument("Acknowledgement Receipt");

  pdf.section("Receipt Information");
  pdf.keyValues([
    ["Quotation Reference", quotation.referenceNumber],
    ["Receipt Date", safeDate(receivedPayment?.paymentDate || receivedPayment?.createdAt || quotation.updatedAt || quotation.createdAt)],
    ["Quotation Status", quotation.status],
    ["Payment Status", quotation.paymentStatus],
    ["Client Name", quotation.clientName],
    ["Email", quotation.email],
    ["Contact Number", quotation.contactNumber],
  ], 2);

  pdf.section("Quotation Items / Services");
  const detailRows: PdfRow[] = quotation.items.map((item) => [
    item.itemName,
    quotationDetailText(item),
    formatPdfPeso(item.amount),
  ]);
  pdf.table(["Service", "Additional Detail / Remarks", "Amount"], detailRows, [1.2, 2.5, 0.9]);

  pdf.section("Payment Information");
  pdf.keyValues([
    ["Payment Method", method?.bank || receivedPayment?.method || latestPayment?.method || "N/A"],
    ["Account Name", method?.accountName || "N/A"],
    ["Account Number", method?.referenceNumber || receivedPayment?.paymentMethodReferenceNumber || latestPayment?.paymentMethodReferenceNumber || "N/A"],
    ["Payment Reference", receivedPayment?.referenceNumber || latestPayment?.referenceNumber || "N/A"],
    ["Amount Received", amountReceived > 0 ? formatPdfPeso(amountReceived) : "No verified payment received"],
    ["Grand Total", formatPdfPeso(quotation.totalAmount)],
    ["Remaining Balance", formatPdfPeso(remainingBalance)],
  ], 2);

  if (latestPayment && !receivedPayment) {
    pdf.paragraph(`Latest submitted payment is ${paymentStatusLabel(latestPayment.status || "pending")} and has not been verified as received.`, 8.8);
  }

  if (receivedPayment?.receiptUrl) {
    pdf.section("Proof Information");
    pdf.paragraph(`Proof of payment file: ${receivedPayment.receiptUrl}`, 8.5);
  }

  pdf.signatureBlock();
  return downloadResponse(pdf.toBuffer(), `Acknowledgement-Receipt-${quotation.referenceNumber || quotation.id}.pdf`);
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
      const dayTitle = [pdfText(item.day), pdfText(item.name)].filter(Boolean).join(" - ");
      pdf.heading(dayTitle || "Itinerary Day", 10);
      const activities = item.activities.map((activity) => pdfText(activity.activity)).filter(Boolean);
      if (activities.length) {
        activities.forEach((activity) => pdf.bullet(activity, 8.8));
      } else {
        pdf.paragraph("No activities listed for this day.", 8.8);
      }
    });
  } else {
    pdf.paragraph("Itinerary details are not available for this package yet.");
  }

  pdf.section("Booking Amount");
  pdf.keyValues([
    ["Package Amount", formatPdfBookingCurrency(numberValue(booking.bookingSelections?.baseAmount), booking.currency)],
    ["Add-ons", formatPdfBookingCurrency(numberValue(booking.bookingSelections?.addonAmount), booking.currency)],
    ["Other Charges", formatPdfBookingCurrency(numberValue(booking.bookingSelections?.departureAdditionalAmount), booking.currency)],
    ["Total Booking Amount", formatPdfBookingCurrency(totalAmount, booking.currency)],
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
    ["Amount Received", formatPdfBookingCurrency(amountReceived, booking.currency)],
    ["Total Booking Amount", formatPdfBookingCurrency(totalAmount, booking.currency)],
    ["Remaining Balance", formatPdfBookingCurrency(remainingBalance, booking.currency)],
  ], 2);

  if (payment?.receiptUrl) {
    pdf.section("Proof Information");
    pdf.paragraph(`Proof of payment file: ${payment.receiptUrl}`, 8.5);
  }

  pdf.signatureBlock();
  return downloadResponse(pdf.toBuffer(), `Acknowledgement-Receipt-${String(booking.reference || bookingId)}.pdf`);
}

export async function paymentAcknowledgementReceiptPdfResponse(paymentId: string) {
  const { adminDb } = await import("@/lib/firebase-admin");
  const paymentDoc = await adminDb.collection("payments").doc(paymentId).get();
  if (!paymentDoc.exists) return null;

  const payment = serializePaymentLog(paymentDoc.id, paymentDoc.data() ?? {});
  if (!["verified", "paid", "approved"].includes(payment.status.toLowerCase())) return "not_verified" as const;

  let sourceReference = payment.bookingReference || payment.quotationReference || "N/A";
  let customerName = "N/A";
  let customerEmail = "N/A";
  let customerContact = "N/A";
  let sourceLabel = "Booking / Quotation Reference";
  let currency: unknown = payment.currency;

  if (payment.bookingId) {
    const bookingDoc = await adminDb.collection("bookings").doc(payment.bookingId).get();
    const booking = bookingDoc.exists ? bookingDoc.data() ?? {} : {};
    sourceReference = String(booking.reference || payment.bookingReference || payment.bookingId);
    customerName = fullName(booking.groupContact);
    customerEmail = String(booking.groupContact?.emailAddress || "N/A");
    customerContact = String(booking.groupContact?.mobileNumber || "N/A");
    sourceLabel = "Booking Reference";
    currency = booking.currency;
  } else if (payment.quotationId) {
    const quotation = await getQuotationWithItems(payment.quotationId);
    if (quotation) {
      sourceReference = quotation.referenceNumber || payment.quotationReference || payment.quotationId;
      customerName = quotation.clientName || "N/A";
      customerEmail = quotation.email || "N/A";
      customerContact = quotation.contactNumber || "N/A";
      sourceLabel = "Quotation Reference";
    }
  }

  const method = await paymentMethodDetails(payment);
  const amountReceived = numberValue(payment.amountSubmitted || payment.amountExpected);
  const pdf = await createDocument("Acknowledgement Receipt");

  pdf.section("Receipt Information");
  pdf.keyValues([
    ["Receipt Reference", payment.referenceNumber || payment.id],
    [sourceLabel, sourceReference],
    ["Received From", customerName],
    ["Email", customerEmail],
    ["Contact Number", customerContact],
    ["Payment For", payment.paymentName || "Payment"],
    ["Payment Status", paymentStatusLabel(payment.status)],
    ["Date Submitted", safeDate(payment.paymentDate || payment.createdAt)],
    ["Date Verified", safeDate(payment.updatedAt)],
  ], 2);

  pdf.section("Payment Received");
  pdf.keyValues([
    ["Payment Amount", formatPdfBookingCurrency(amountReceived, currency)],
    ["Payment Method", method?.bank || payment.method || "N/A"],
    ["Account Name", method?.accountName || "N/A"],
    ["Account Number", method?.referenceNumber || payment.paymentMethodReferenceNumber || "N/A"],
    ["Transaction Reference", payment.referenceNumber || "N/A"],
  ], 2);

  if (payment.receiptUrl) {
    pdf.section("Proof Information");
    pdf.paragraph(`Proof of payment file: ${payment.receiptUrl}`, 8.5);
  }

  pdf.signatureBlock();
  return downloadResponse(pdf.toBuffer(), `Acknowledgement-Receipt-${payment.referenceNumber || payment.id}.pdf`);
}

export type { Quotation };
