"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Download, ExternalLink, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { Route } from "next";
import { StatusBadge } from "@/components/domain/status-badge";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate, formatPeso } from "@/lib/utils";

type PaymentLog = {
  id: string;
  source?: string;
  bookingId?: string;
  bookingReference?: string;
  quotationId?: string;
  quotationReference?: string;
  paymentScheduleId?: string;
  paymentName?: string;
  method?: string;
  paymentMethodReferenceNumber?: string;
  referenceNumber?: string;
  amountExpected?: number;
  amountSubmitted?: number;
  receiptUrl?: string;
  paymentDate?: string;
  notes?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

function isReceiptDownloadable(status?: string) {
  return ["verified", "paid", "approved"].includes(String(status || "").toLowerCase());
}

export function PaymentVerificationManagement({ initialPayments = [] }: { initialPayments?: PaymentLog[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [payments, setPayments] = useState(initialPayments);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentLog | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [verifyingPaymentId, setVerifyingPaymentId] = useState("");
  const [deletingPaymentId, setDeletingPaymentId] = useState("");
  const [currentCursor, setCurrentCursor] = useState("");
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState("");
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (currentCursor) params.set("cursor", currentCursor);

    fetch(`/api/admin/payments${params.toString() ? `?${params}` : ""}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load payments")))
      .then((data) => {
        setPayments(data.payments);
        setNextCursor(data.nextCursor ?? "");
        setHasNext(Boolean(data.hasNext));
        setTotalPayments(Number(data.total ?? 0));
        setPageSize(Number(data.pageSize ?? 10));
      })
      .catch(() => setMessage("Unable to load submitted payment proofs."))
      .finally(() => setLoading(false));
  }, [currentCursor]);

  useEffect(() => {
    const paymentLogId = searchParams.get("paymentLogId");
    if (!paymentLogId) return;

    const existing = payments.find((payment) => payment.id === paymentLogId);
    if (existing) {
      setSelectedPayment(existing);
      return;
    }

    setSelectedLoading(true);
    fetch(`/api/admin/payments/${encodeURIComponent(paymentLogId)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load payment log")))
      .then((data) => setSelectedPayment(data.payment))
      .catch(() => setMessage("Unable to load the selected payment log."))
      .finally(() => setSelectedLoading(false));
  }, [payments, searchParams]);

  async function updateStatus(payment: PaymentLog, status: "verified" | "rejected") {
    setVerifyingPaymentId(payment.id);
    const response = await fetch(`/api/admin/payments/${payment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json().catch(() => ({}));
    setVerifyingPaymentId("");
    if (!response.ok) {
      setMessage(data?.error ?? "Unable to update payment.");
      return;
    }
    const updatedPayment = data.payment ?? { ...payment, status };
    setPayments((current) => current.map((item) => item.id === payment.id ? { ...item, ...updatedPayment } : item));
    setSelectedPayment((current) => current?.id === payment.id ? { ...current, ...updatedPayment } : current);
    setMessage(status === "verified" ? "Payment verified." : "Payment rejected.");
  }

  async function deletePayment(payment: PaymentLog) {
    const reference = payment.referenceNumber || payment.paymentName || payment.id;
    if (!window.confirm(`Delete Payment Log?\n\nAre you sure you want to delete ${reference}?`)) return;

    setDeletingPaymentId(payment.id);
    const response = await fetch(`/api/admin/payments/${payment.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setDeletingPaymentId("");

    if (!response.ok) {
      setMessage(data?.error ?? "Unable to delete payment log.");
      return;
    }

    setPayments((current) => current.filter((item) => item.id !== payment.id));
    setTotalPayments((current) => Math.max(0, current - 1));
    setMessage("Payment log deleted.");
    closePayment();
  }

  function openPayment(payment: PaymentLog) {
    setSelectedPayment(payment);
    const params = new URLSearchParams(searchParams.toString());
    params.set("paymentLogId", payment.id);
    router.replace(`/admin/payments/verification?${params.toString()}` as Route, { scroll: false });
  }

  function closePayment() {
    setSelectedPayment(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("paymentLogId");
    const query = params.toString();
    router.replace(`/admin/payments/verification${query ? `?${query}` : ""}` as Route, { scroll: false });
  }

  function nextPage() {
    if (!nextCursor) return;
    setPage((current) => current + 1);
    setCursorStack((current) => [...current, currentCursor]);
    setCurrentCursor(nextCursor);
  }

  function previousPage() {
    if (page <= 1) return;
    setPage((current) => Math.max(1, current - 1));
    setCursorStack((current) => {
      const nextStack = [...current];
      setCurrentCursor(nextStack.pop() ?? "");
      return nextStack;
    });
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
                <TH className="w-[280px] text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {loading && <TR><TD colSpan={7}>Loading submitted payment proofs...</TD></TR>}
              {!loading && !payments.length && <TR><TD colSpan={7}>No submitted payment proofs yet.</TD></TR>}
              {!loading && payments.map((payment) => (
                <TR key={payment.id} className="cursor-pointer hover:bg-viaje-paper" onClick={() => openPayment(payment)}>
                  <TD>{payment.referenceNumber || payment.id}</TD>
                  <TD>
                    {payment.source === "QUOTATION" ? (
                      <div className="grid gap-1">
                        <span className="font-semibold text-viaje-navy">Quotation</span>
                        {payment.quotationId ? (
                          <Link
                            href={`/admin/quotations?quotationId=${encodeURIComponent(payment.quotationId)}`}
                            className="text-xs font-semibold text-viaje-red hover:underline"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {payment.quotationReference || payment.quotationId}
                          </Link>
                        ) : (
                          <span className="text-xs text-viaje-soft">{payment.quotationReference}</span>
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-1">
                        <span className="font-semibold text-viaje-navy">Booking</span>
                        {payment.bookingId ? (
                          <Link
                            href={`/admin/bookings?bookingId=${encodeURIComponent(payment.bookingId)}`}
                            className="text-xs font-semibold text-viaje-red hover:underline"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {payment.bookingReference || payment.bookingId}
                          </Link>
                        ) : (
                          <span className="text-xs text-viaje-soft">{payment.bookingReference || "-"}</span>
                        )}
                      </div>
                    )}
                  </TD>
                  <TD className="capitalize">{payment.method || (payment.status === "pending" ? "Pending" : "-")}</TD>
                  <TD>
                    <div className="font-medium">{formatPeso(Number(payment.amountSubmitted || payment.amountExpected || 0))}</div>
                    <div className="text-xs text-muted-foreground">{payment.paymentDate ? formatDate(payment.paymentDate) : "-"}</div>
                  </TD>
                  <TD>{formatPeso(Number(payment.amountExpected || 0))}</TD>
                  <TD><StatusBadge status={payment.status || "for_verification"} /></TD>
                  <TD className="whitespace-nowrap">
                    <div className="flex flex-nowrap justify-end gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); openPayment(payment); }}>
                        Details
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <PaginationControls
            canPrevious={page > 1}
            canNext={hasNext}
            loading={loading}
            page={page}
            pageSize={pageSize}
            total={totalPayments}
            itemCount={payments.length}
            onPrevious={previousPage}
            onNext={nextPage}
          />
        </CardContent>
      </Card>

      {(selectedPayment || selectedLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-viaje-navy/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[8px] bg-white shadow-[0_28px_80px_-30px_rgba(0,0,0,0.65)]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-viaje-line bg-white px-5 py-4">
              <div>
                <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-viaje-red">Payment Details</p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-viaje-navy">
                  {selectedPayment?.paymentName || selectedPayment?.referenceNumber || selectedPayment?.id || "Loading payment"}
                </h2>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={closePayment} aria-label="Close payment details">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-5 p-5">
              {selectedLoading && !selectedPayment ? (
                <p className="rounded-[8px] border border-viaje-line bg-viaje-paper p-4 text-sm text-viaje-soft">Loading payment details...</p>
              ) : selectedPayment && (
                <>
                  <Card>
                    <CardHeader><CardTitle>Payment Information</CardTitle></CardHeader>
                    <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                      <p><span className="text-viaje-soft">Payment Reference</span><br /><strong className="text-viaje-navy">{selectedPayment.referenceNumber || selectedPayment.id}</strong></p>
                      <p><span className="text-viaje-soft">Source</span><br /><strong className="text-viaje-navy">{selectedPayment.source || (selectedPayment.quotationId ? "QUOTATION" : "BOOKING")}</strong></p>
                      <p><span className="text-viaje-soft">Booking / Quotation Reference</span><br /><strong className="text-viaje-navy">{selectedPayment.bookingReference || selectedPayment.quotationReference || selectedPayment.bookingId || selectedPayment.quotationId || "N/A"}</strong></p>
                      <p><span className="text-viaje-soft">Payment Name</span><br /><strong className="text-viaje-navy">{selectedPayment.paymentName || "N/A"}</strong></p>
                      <p><span className="text-viaje-soft">Payment Amount</span><br /><strong className="text-viaje-navy">{formatPeso(Number(selectedPayment.amountSubmitted || selectedPayment.amountExpected || 0))}</strong></p>
                      <p><span className="text-viaje-soft">Expected Amount</span><br /><strong className="text-viaje-navy">{formatPeso(Number(selectedPayment.amountExpected || 0))}</strong></p>
                      <p><span className="text-viaje-soft">Payment Method</span><br /><strong className="text-viaje-navy">{selectedPayment.method || "Pending submission"}</strong></p>
                      <p><span className="text-viaje-soft">Transaction Date</span><br /><strong className="text-viaje-navy">{selectedPayment.paymentDate ? formatDate(selectedPayment.paymentDate) : "N/A"}</strong></p>
                      <p><span className="text-viaje-soft">Payment Status</span><br /><StatusBadge status={selectedPayment.status || "pending"} /></p>
                      <p><span className="text-viaje-soft">Schedule ID</span><br /><strong className="text-viaje-navy">{selectedPayment.paymentScheduleId || "N/A"}</strong></p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Payment Proof</CardTitle></CardHeader>
                    <CardContent>
                      {selectedPayment.receiptUrl ? (
                        <Button type="button" variant="outline" onClick={() => window.open(selectedPayment.receiptUrl, "_blank", "noopener,noreferrer")}>
                          <ExternalLink className="h-4 w-4" />
                          View Proof of Payment
                        </Button>
                      ) : (
                        <p className="text-sm text-viaje-soft">No proof has been submitted for this payment yet.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Verification Information</CardTitle></CardHeader>
                    <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                      <p><span className="text-viaje-soft">Submission Date</span><br /><strong className="text-viaje-navy">{selectedPayment.createdAt ? formatDate(selectedPayment.createdAt) : "N/A"}</strong></p>
                      <p><span className="text-viaje-soft">Verification Date</span><br /><strong className="text-viaje-navy">{selectedPayment.updatedAt && selectedPayment.status !== "for_verification" ? formatDate(selectedPayment.updatedAt) : "N/A"}</strong></p>
                      <p><span className="text-viaje-soft">Verified By</span><br /><strong className="text-viaje-navy">N/A</strong></p>
                      <p><span className="text-viaje-soft">Remarks / Rejection Reason</span><br /><strong className="text-viaje-navy">{selectedPayment.notes || "N/A"}</strong></p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {selectedPayment.status === "for_verification" && selectedPayment.receiptUrl ? (
                        <>
                          <Button type="button" onClick={() => updateStatus(selectedPayment, "verified")} disabled={verifyingPaymentId === selectedPayment.id}>
                            <CheckCircle2 className="h-4 w-4" />
                            {verifyingPaymentId === selectedPayment.id ? "Approving..." : "Approve Payment"}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => updateStatus(selectedPayment, "rejected")} disabled={verifyingPaymentId === selectedPayment.id}>
                            <XCircle className="h-4 w-4" />
                            {verifyingPaymentId === selectedPayment.id ? "Rejecting..." : "Reject Payment"}
                          </Button>
                        </>
                      ) : (
                        <p className="text-sm text-viaje-soft">
                          {selectedPayment.status === "pending"
                            ? "This scheduled payment has not been submitted yet."
                            : "No verification action is available for this payment status."}
                        </p>
                      )}
                      <Button type="button" variant="outline" onClick={closePayment}>Close</Button>
                      {isReceiptDownloadable(selectedPayment.status) && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => window.open(`/api/admin/payments/${encodeURIComponent(selectedPayment.id)}/acknowledgement-receipt-pdf`, "_blank", "noopener,noreferrer")}
                        >
                          <Download className="h-4 w-4" />
                          Download Acknowledgement Receipt
                        </Button>
                      )}
                      {selectedPayment.status === "pending" && !selectedPayment.receiptUrl && Number(selectedPayment.amountSubmitted || 0) <= 0 && (
                        <Button type="button" variant="outline" className="text-viaje-red" onClick={() => deletePayment(selectedPayment)} disabled={deletingPaymentId === selectedPayment.id}>
                          {deletingPaymentId === selectedPayment.id ? "Deleting..." : "Delete Payment Log"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
