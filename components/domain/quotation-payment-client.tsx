"use client";

import { useMemo, useState } from "react";
import { PackageMediaField } from "@/components/admin/package-media-field";
import { PaymentMethodButtonContent, PaymentMethodDetails, PaymentMethodQrImage } from "@/components/domain/payment-method-display";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PaymentMethod } from "@/lib/payment-methods";
import { formatPeso } from "@/lib/utils";

type QuotationItem = {
  id: string;
  itemName: string;
  remarks: string;
  amount: number;
};

type Quotation = {
  referenceNumber: string;
  clientName: string;
  totalAmount: number;
  paymentStatus: string;
  items: QuotationItem[];
};

const labelClass = "text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft";
const fieldClass = "grid gap-1.5";

export function QuotationPaymentClient({ quotation, paymentMethods, token }: { quotation: Quotation; paymentMethods: PaymentMethod[]; token: string }) {
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? "");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedPaymentMethod = useMemo(() => paymentMethods.find((method) => method.id === paymentMethodId) ?? null, [paymentMethodId, paymentMethods]);

  async function submitPayment() {
    if (!selectedPaymentMethod || !receiptUrl) {
      setStatus("Payment method and proof of payment are required.");
      return;
    }

    setSubmitting(true);
    const response = await fetch(`/api/quotations/${token}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethodId: selectedPaymentMethod.id,
        paymentMethodBank: selectedPaymentMethod.bank,
        paymentMethodReferenceNumber: selectedPaymentMethod.referenceNumber,
        receiptUrl,
        notes,
      }),
    });
    setSubmitting(false);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(data?.error ?? "Unable to submit payment.");
      return;
    }
    setSubmitted(true);
  }

  return (
    <main className="bg-viaje-paper">
      <section className="container-page max-w-5xl py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-viaje-red">Quotation Payment</p>
            <h1 className="mt-3 font-serif text-4xl font-bold text-viaje-navy">{quotation.referenceNumber}</h1>
            <p className="mt-2 text-viaje-soft">Prepared for {quotation.clientName}</p>
          </div>
          <StatusBadge status={quotation.paymentStatus} />
        </div>

        {submitted ? (
          <Card><CardContent className="p-6 text-lg text-viaje-navy">Payment submitted for verification. Viaje will review the proof before marking this quotation as paid.</CardContent></Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader><CardTitle>Amount to Pay</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <p className="text-4xl font-bold text-viaje-navy">{formatPeso(quotation.totalAmount)}</p>
                <div className="divide-y divide-viaje-line rounded-[10px] border border-viaje-line">
                  {quotation.items.map((item) => (
                    <div key={item.id} className="grid gap-1 p-3 text-sm">
                      <div className="flex justify-between gap-3 font-semibold text-viaje-navy">
                        <span>{item.itemName}</span>
                        <span>{formatPeso(item.amount)}</span>
                      </div>
                      <p className="text-viaje-soft">{item.remarks}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Submit Payment</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {status && <p className="rounded-[8px] border border-viaje-line bg-viaje-paper p-3 text-sm text-viaje-soft">{status}</p>}
                {!paymentMethods.length ? (
                  <p className="rounded-[8px] border border-viaje-line bg-viaje-paper p-4 text-sm text-viaje-soft">No payment methods are available yet.</p>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {paymentMethods.map((method) => (
                        <button key={method.id} type="button" onClick={() => setPaymentMethodId(method.id)} className="text-left">
                          <Card className={`rounded-lg transition ${method.id === paymentMethodId ? "border-viaje-red ring-2 ring-viaje-red/20" : ""}`}>
                            <CardContent className="p-0">
                              <PaymentMethodButtonContent method={method} />
                            </CardContent>
                          </Card>
                        </button>
                      ))}
                    </div>
                    {selectedPaymentMethod && (
                      <div className={`grid gap-5 ${selectedPaymentMethod.qrImageUrl ? "md:grid-cols-[180px_1fr]" : ""}`}>
                        <PaymentMethodQrImage method={selectedPaymentMethod} />
                        <div className="space-y-4">
                          <PaymentMethodDetails method={selectedPaymentMethod} />
                          <label className={fieldClass}><span className={labelClass}>Notes</span><Input value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
                        </div>
                      </div>
                    )}
                    <div className="max-w-[220px]">
                      <span className={labelClass}>Proof of Payment Screenshot</span>
                      <div className="mt-2"><PackageMediaField label="Proof of Payment Screenshot" folder="quotation-payment-proofs" value={receiptUrl} onUploaded={setReceiptUrl} uploadUrl="/api/bookings/payment-proof/upload" /></div>
                    </div>
                    <Button type="button" className="w-full" onClick={submitPayment} disabled={submitting || !receiptUrl || !selectedPaymentMethod}>
                      {submitting ? "Submitting..." : "Submit Payment"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </main>
  );
}
