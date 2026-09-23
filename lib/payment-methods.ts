export type PaymentMethod = {
  id: string;
  bank: string;
  accountName: string;
  referenceNumber: string;
  bankLogoUrl: string;
  qrImageUrl: string;
};

export function newPaymentMethod(): PaymentMethod {
  const id = `paymethod-${Date.now()}`;
  return {
    id,
    bank: "",
    accountName: "",
    referenceNumber: "",
    bankLogoUrl: "",
    qrImageUrl: "",
  };
}

export function normalizePaymentMethod(input?: Partial<PaymentMethod> | null): PaymentMethod {
  const fallback = newPaymentMethod();
  return {
    id: input?.id || fallback.id,
    bank: input?.bank?.trim() ?? "",
    accountName: input?.accountName?.trim() ?? "",
    referenceNumber: input?.referenceNumber?.trim() ?? "",
    bankLogoUrl: input?.bankLogoUrl?.trim() ?? "",
    qrImageUrl: input?.qrImageUrl?.trim() ?? "",
  };
}

export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  const { adminDb } = await import("@/lib/firebase-admin");
  const snapshot = await adminDb.collection("paymentMethods").orderBy("bank").get();
  return snapshot.docs.map((doc) => normalizePaymentMethod({ id: doc.id, ...doc.data() }));
}
