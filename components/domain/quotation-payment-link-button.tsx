"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  publicToken: string;
  paymentToken: string;
};

export function QuotationPaymentLinkButton({ publicToken, paymentToken }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function proceedToPayment() {
    if (paymentToken) {
      window.location.assign(`/payment/quotation/${encodeURIComponent(paymentToken)}`);
      return;
    }

    setLoading(true);
    setError("");
    const response = await fetch(`/api/quotations/${encodeURIComponent(publicToken)}/payment-link`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok || !data?.paymentUrl) {
      setError(data?.error || "Unable to prepare the payment link. Please try again.");
      return;
    }

    window.location.assign(data.paymentUrl);
  }

  return (
    <div className="grid gap-2">
      <Button type="button" className="h-12 px-6" onClick={proceedToPayment} disabled={loading}>
        <CreditCard className="h-4 w-4" />
        {loading ? "Preparing Payment..." : "Proceed to Payment"}
      </Button>
      {error && <p className="max-w-[260px] text-sm text-viaje-red" role="alert">{error}</p>}
    </div>
  );
}
