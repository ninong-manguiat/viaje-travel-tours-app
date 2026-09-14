"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PackageMediaField } from "@/components/admin/package-media-field";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PaymentMethod } from "@/lib/payment-methods";
import { formatPeso } from "@/lib/utils";

const labelClass = "text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft";
const fieldClass = "grid gap-1.5";

type BookingPaymentSummary = {
  reference: string;
  packageTitle: string;
};

export function BookingPaymentClient({
  booking,
  remainingBalance,
  paymentMethods,
  token,
}: {
  booking: BookingPaymentSummary;
  remainingBalance: number;
  paymentMethods: PaymentMethod[];
  token: string;
}) {
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
    const response = await fetch(`/api/bookings/${encodeURIComponent(token)}/payment`, {
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
    <main className="container-page max-w-5xl py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-viaje-red">Manual Payment</p>
          <h1 className="text-3xl font-bold text-viaje-navy">{booking.reference}</h1>
          <p className="mt-2 text-sm text-viaje-soft">{booking.packageTitle || "Booking balance payment"}</p>
        </div>
        <StatusBadge status="for_verification" />
      </div>

      {submitted ? (
        <Card>
          <CardContent className="space-y-4 p-6 text-viaje-navy">
            <p className="text-lg font-semibold">Payment submitted for verification.</p>
            <p className="text-sm text-viaje-soft">Viaje will verify the payment before marking it as paid.</p>
            <Link href={`/dashboard/bookings/${encodeURIComponent(token)}`}>
              <Button>Back to Booking</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader><CardTitle>Amount Due</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-3xl font-bold text-viaje-navy">{formatPeso(remainingBalance)}</p>
              <p className="text-sm text-muted-foreground">Upload proof after sending payment through your preferred manual channel.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Submit Payment for Verification</CardTitle></CardHeader>
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
                          <CardContent className="p-4 font-semibold text-viaje-navy">{method.bank}</CardContent>
                        </Card>
                      </button>
                    ))}
                  </div>
                  {selectedPaymentMethod && (
                    <div className="grid gap-5 md:grid-cols-[180px_1fr]">
                      <img src={selectedPaymentMethod.qrImageUrl} alt={`${selectedPaymentMethod.bank} payment QR`} className="aspect-square w-full rounded-lg border border-viaje-line object-cover" />
                      <div className="space-y-4">
                        <div className="rounded-lg border border-viaje-line bg-viaje-paper p-4 text-sm">
                          <p className="font-semibold text-viaje-navy">{selectedPaymentMethod.bank}</p>
                          <p className="mt-1 text-viaje-soft">Reference Number: <strong className="text-viaje-navy">{selectedPaymentMethod.referenceNumber}</strong></p>
                        </div>
                        <label className={fieldClass}><span className={labelClass}>Notes</span><Input value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
                      </div>
                    </div>
                  )}
                  <div className="max-w-[220px]">
                    <span className={labelClass}>Proof of Payment Screenshot</span>
                    <div className="mt-2"><PackageMediaField label="Proof of Payment Screenshot" folder="booking-payment-proofs" value={receiptUrl} onUploaded={setReceiptUrl} uploadUrl="/api/bookings/payment-proof/upload" /></div>
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
    </main>
  );
}
