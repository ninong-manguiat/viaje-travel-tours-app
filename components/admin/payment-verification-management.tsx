"use client";

import Link from "next/link";
import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate, formatPeso } from "@/lib/utils";

type PaymentLog = {
  id: string;
  source?: string;
  bookingId?: string;
  quotationId?: string;
  quotationReference?: string;
  method?: string;
  referenceNumber?: string;
  amountExpected?: number;
  amountSubmitted?: number;
  receiptUrl?: string;
  paymentDate?: string;
  status?: string;
  createdAt?: string;
};

export function PaymentVerificationManagement({ initialPayments }: { initialPayments: PaymentLog[] }) {
  const [payments, setPayments] = useState(initialPayments);
  const [message, setMessage] = useState("");

  async function updateStatus(payment: PaymentLog, status: "verified" | "rejected") {
    const response = await fetch(`/api/admin/payments/${payment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data?.error ?? "Unable to update payment.");
      return;
    }
    setPayments((current) => current.map((item) => item.id === payment.id ? { ...item, status } : item));
    setMessage(status === "verified" ? "Payment verified." : "Payment rejected.");
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <p className="font-semibold text-viaje-red">Payments</p>
        <h1 className="text-3xl font-bold text-viaje-navy">Verification Queue</h1>
      </div>
      {message && <p className="rounded-[8px] border border-viaje-line bg-white p-3 text-sm text-viaje-soft">{message}</p>}
      <Card>
        <CardHeader><CardTitle>Submitted Proofs</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Reference</TH>
                <TH>Source</TH>
                <TH>Method</TH>
                <TH>Submitted</TH>
                <TH>Expected</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {!payments.length && <TR><TD colSpan={7}>No submitted payment proofs yet.</TD></TR>}
              {payments.map((payment) => (
                <TR key={payment.id}>
                  <TD>{payment.referenceNumber || payment.id}</TD>
                  <TD>
                    {payment.source === "QUOTATION" ? (
                      <div className="grid gap-1">
                        <span className="font-semibold text-viaje-navy">Quotation</span>
                        {payment.quotationId ? (
                          <Link href="/admin/quotations" className="text-xs font-semibold text-viaje-red hover:underline">{payment.quotationReference}</Link>
                        ) : (
                          <span className="text-xs text-viaje-soft">{payment.quotationReference}</span>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-1">
                        <span className="font-semibold text-viaje-navy">Booking</span>
                        <span className="text-xs text-viaje-soft">{payment.bookingId || "-"}</span>
                      </div>
                    )}
                  </TD>
                  <TD className="capitalize">{payment.method || "-"}</TD>
                  <TD>
                    <div className="font-medium">{formatPeso(Number(payment.amountSubmitted || 0))}</div>
                    <div className="text-xs text-muted-foreground">{payment.paymentDate ? formatDate(payment.paymentDate) : "-"}</div>
                  </TD>
                  <TD>{formatPeso(Number(payment.amountExpected || 0))}</TD>
                  <TD><StatusBadge status={payment.status || "for_verification"} /></TD>
                  <TD>
                    <div className="flex flex-wrap justify-end gap-2">
                      {payment.receiptUrl && (
                        <Button type="button" size="sm" variant="outline" onClick={() => window.open(payment.receiptUrl, "_blank", "noopener,noreferrer")}>
                          <ExternalLink className="h-3.5 w-3.5" />Proof
                        </Button>
                      )}
                      <Button type="button" size="sm" onClick={() => updateStatus(payment, "verified")} disabled={payment.status === "verified"}>
                        <CheckCircle2 className="h-3.5 w-3.5" />Approve
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => updateStatus(payment, "rejected")} disabled={payment.status === "rejected"}>
                        <XCircle className="h-3.5 w-3.5" />Reject
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
