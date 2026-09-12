import { AdminShell } from "@/components/layout/admin-shell";
import { PaymentVerificationManagement } from "@/components/admin/payment-verification-management";

export const dynamic = "force-dynamic";

function serializeDate(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value && "toDate" in value && typeof value.toDate === "function") return value.toDate().toISOString();
  return "";
}

export default async function PaymentVerificationPage() {
  const { adminDb } = await import("@/lib/firebase-admin");
  const snapshot = await adminDb.collection("payments").orderBy("createdAt", "desc").get();
  const payments = snapshot.docs.map((doc) => {
    const data = doc.data() ?? {};
    return {
      id: doc.id,
      source: String(data.source || ""),
      bookingId: String(data.bookingId || ""),
      quotationId: String(data.quotationId || ""),
      quotationReference: String(data.quotationReference || ""),
      method: String(data.method || ""),
      referenceNumber: String(data.referenceNumber || ""),
      amountExpected: Number(data.amountExpected || 0),
      amountSubmitted: Number(data.amountSubmitted || 0),
      receiptUrl: String(data.receiptUrl || ""),
      paymentDate: String(data.paymentDate || ""),
      status: String(data.status || "for_verification"),
      createdAt: serializeDate(data.createdAt),
    };
  });

  return (
    <AdminShell>
      <PaymentVerificationManagement initialPayments={payments} />
    </AdminShell>
  );
}
