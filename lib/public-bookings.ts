import "server-only";

export type PublicBookingPayment = {
  id: string;
  paymentName: string;
  method: string;
  referenceNumber: string;
  amountExpected: number;
  amountSubmitted: number;
  receiptUrl: string;
  paymentDate: string;
  status: string;
  createdAt: string;
};

export type PublicBooking = {
  id: string;
  reference: string;
  packageId: string;
  packageTitle: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  source: string;
  groupContact: Record<string, unknown>;
  createdAt: string;
  paymentSchedule: Array<{ id?: string; label?: string; amount?: number; dueDate?: string; status?: string }>;
};

function timestampValue(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value && typeof value === "object" && "seconds" in value && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000).toISOString();
  }

  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function paymentLogName(payment: Record<string, unknown>) {
  return String(payment.paymentName || payment.label || payment.transactionId || "Manual Payment");
}

export function paidFromPayments(payments: PublicBookingPayment[]) {
  return payments.reduce((sum, payment) => ["verified", "paid"].includes(payment.status.toLowerCase()) ? sum + payment.amountSubmitted : sum, 0);
}

export function paidFromSchedule(schedule: PublicBooking["paymentSchedule"]) {
  return schedule.reduce((sum, item) => ["verified", "paid"].includes(String(item.status || "").toLowerCase()) ? sum + numberValue(item.amount) : sum, 0);
}

export function currentBookingBalance(booking: PublicBooking, payments: PublicBookingPayment[]) {
  const totalAmount = numberValue(booking.totalAmount);
  const totalPaid = payments.length ? paidFromPayments(payments) : paidFromSchedule(booking.paymentSchedule);
  return {
    totalAmount,
    totalPaid,
    remainingBalance: Math.max(0, totalAmount - totalPaid),
  };
}

export async function getPublicBooking(identifier: string) {
  const { adminDb } = await import("@/lib/firebase-admin");
  let doc = await adminDb.collection("bookings").doc(identifier).get();

  if (!doc.exists) {
    const snapshot = await adminDb.collection("bookings").where("reference", "==", identifier).limit(1).get();
    doc = snapshot.docs[0];
  }

  if (!doc?.exists) return null;

  const data = doc.data() ?? {};
  const paymentsSnapshot = await adminDb.collection("payments").where("bookingId", "==", doc.id).get();
  const payments = paymentsSnapshot.docs
    .map((paymentDoc) => {
      const payment = paymentDoc.data() ?? {};
      return {
        id: paymentDoc.id,
        paymentName: paymentLogName(payment),
        method: String(payment.method || ""),
        referenceNumber: String(payment.referenceNumber || ""),
        amountExpected: numberValue(payment.amountExpected),
        amountSubmitted: numberValue(payment.amountSubmitted),
        receiptUrl: String(payment.receiptUrl || ""),
        paymentDate: String(payment.paymentDate || ""),
        status: String(payment.status || "for_verification"),
        createdAt: timestampValue(payment.createdAt),
      };
    })
    .sort((a, b) => (b.createdAt || b.paymentDate).localeCompare(a.createdAt || a.paymentDate));

  const booking: PublicBooking = {
    id: doc.id,
    reference: String(data.reference || doc.id),
    packageId: String(data.packageId || ""),
    packageTitle: String(data.packageTitle || ""),
    status: String(data.status || ""),
    paymentStatus: String(data.paymentStatus || ""),
    totalAmount: numberValue(data.totalAmount ?? data.bookingSelections?.finalAmount),
    source: String(data.source || ""),
    groupContact: data.groupContact && typeof data.groupContact === "object" ? data.groupContact : {},
    createdAt: timestampValue(data.createdAt),
    paymentSchedule: Array.isArray(data.paymentSchedule) ? data.paymentSchedule : [],
  };

  return { booking, payments, summary: currentBookingBalance(booking, payments) };
}
