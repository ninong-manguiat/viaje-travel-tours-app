"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, FileText, Link as LinkIcon, Mail, Plus, Trash2, X } from "lucide-react";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { DocumentBinProgressIndicator } from "@/components/admin/document-bin-management";
import { documentBinProgress, documentName, type DocumentBin } from "@/lib/document-bins";
import { formatDate, formatPeso } from "@/lib/utils";

type PaymentScheduleItem = {
  id: string;
  label: string;
  amount: number;
  dueDate: string;
  status: string;
};

type AdminBooking = {
  id: string;
  reference?: string;
  packageId?: string;
  packageSlug?: string;
  packageTitle?: string;
  departureId?: string;
  addonId?: string;
  status?: string;
  paymentStatus?: string;
  totalAmount?: number;
  amountPaid?: number;
  balance?: number;
  createdAt?: string;
  documentBinId?: string;
  documentToken?: string;
  documentRequirements?: Array<{
    id: string;
    type: string;
    status: string;
    uploadedFileUrl?: string;
    requestedAt?: string;
    submittedAt?: string;
  }>;
  guests?: Array<Record<string, unknown>>;
  groupContact?: Record<string, string>;
  paymentOption?: string;
  paymentType?: string;
  paymentInfo?: {
    method?: string;
    transactionReferenceNumber?: string;
    paymentMethodReferenceNumber?: string;
    receiptUrl?: string;
    amountSubmitted?: number;
    paymentDate?: string;
  };
  paymentSchedule?: PaymentScheduleItem[];
  bookingSelections?: {
    pax?: number;
    baseAmount?: number;
    departureAdditionalAmount?: number;
    addonAmount?: number;
    finalAmount?: number;
    selectedDeparture?: { id?: string; startDate?: string; endDate?: string };
    selectedAddon?: { id?: string; label?: string; price?: number };
  };
};

const paymentStatusOptions = [
  { value: "pending", label: "PENDING" },
  { value: "for_verification", label: "FOR VERIFICATION" },
  { value: "verified", label: "VERIFIED" },
  { value: "rejected", label: "REJECTED" },
];

const bookingStatusOptions = ["PENDING FOR VERIFICATION", "CONFIRMED", "CANCELLED"];

function contactName(booking: AdminBooking) {
  const firstName = booking.groupContact?.firstName ?? "";
  const lastName = booking.groupContact?.lastName ?? "";
  return `${firstName} ${lastName}`.trim() || "No contact name";
}

function dateLabel(value?: string) {
  return value ? formatDate(value) : "No date";
}

function timeLabel(value?: string) {
  if (!value) return "No time";

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function scheduleFor(booking: AdminBooking) {
  if (Array.isArray(booking.paymentSchedule) && booking.paymentSchedule.length) return booking.paymentSchedule;

  return [{
    id: "full-payment",
    label: "Full Payment",
    amount: Number(booking.totalAmount ?? 0),
    dueDate: booking.createdAt ?? "",
    status: booking.paymentStatus ?? "for_verification",
  }];
}

function paidFromSchedule(schedule: PaymentScheduleItem[]) {
  return schedule.reduce((sum, item) => ["verified", "paid"].includes(item.status.toLowerCase()) ? sum + Number(item.amount || 0) : sum, 0);
}

function documentBinLink(bin: DocumentBin) {
  if (typeof window === "undefined" || !bin.publicToken) return "";
  return `${window.location.origin}/documents/${bin.publicToken}`;
}

function documentProgressLabel(bin: DocumentBin) {
  const progress = documentBinProgress(bin.requirements);
  return `${progress.submitted} of ${progress.total} submitted • ${progress.approved} approved`;
}

function documentProgressPercent(bin: DocumentBin) {
  const progress = documentBinProgress(bin.requirements);
  if (!progress.total) return 0;
  return Math.round((progress.submitted / progress.total) * 100);
}

export function BookingManagement() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [selected, setSelected] = useState<AdminBooking | null>(null);
  const [documentBin, setDocumentBin] = useState<DocumentBin | null>(null);
  const [documentBinLoading, setDocumentBinLoading] = useState(false);
  const [newPayment, setNewPayment] = useState({ label: "", amount: "", dueDate: "" });
  const [sendingConfirmation, setSendingConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/admin/bookings")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load bookings")))
      .then((data) => setBookings(data.bookings))
      .catch(() => setStatus("Unable to load bookings."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || selected) return;
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get("bookingId") || "";
    if (!bookingId) return;

    const existing = bookings.find((booking) => booking.id === bookingId);
    if (existing) {
      setSelected(existing);
      return;
    }

    fetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load booking")))
      .then((data) => setSelected(data.booking))
      .catch(() => setStatus("Unable to load linked booking."));
  }, [bookings, loading, selected]);

  useEffect(() => {
    if (!selected?.documentBinId) {
      setDocumentBin(null);
      setDocumentBinLoading(false);
      return;
    }

    setDocumentBinLoading(true);
    fetch(`/api/admin/document-bins/${encodeURIComponent(selected.documentBinId)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load document bin")))
      .then((data) => setDocumentBin(data.documentBin))
      .catch(() => {
        setDocumentBin(null);
        setStatus("Unable to load linked document bin.");
      })
      .finally(() => setDocumentBinLoading(false));
  }, [selected?.documentBinId]);

  const selectedSchedule = useMemo(() => selected ? scheduleFor(selected) : [], [selected]);
  const totalPaid = paidFromSchedule(selectedSchedule);
  const totalAmount = Number(selected?.totalAmount ?? selected?.bookingSelections?.finalAmount ?? 0);
  const remainingBalance = Math.max(0, totalAmount - totalPaid);

  function openBooking(booking: AdminBooking) {
    setSelected(booking);
    const url = new URL(window.location.href);
    url.searchParams.set("bookingId", booking.id);
    window.history.pushState(null, "", url.toString());
  }

  function closeBooking() {
    setSelected(null);
    setDocumentBin(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("bookingId");
    window.history.pushState(null, "", url.toString());
  }

  async function updateScheduleStatus(scheduleItemId: string, nextStatus: string) {
    if (!selected) return;

    const response = await fetch(`/api/admin/bookings/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateScheduleStatus", scheduleItemId, status: nextStatus }),
    });

    if (!response.ok) {
      setStatus("Unable to update payment status.");
      return;
    }

    const data = await response.json();
    const updated = { ...selected, paymentSchedule: data.paymentSchedule, paymentStatus: data.paymentStatus, status: data.status };
    setSelected(updated);
    setBookings((current) => current.map((booking) => booking.id === updated.id ? updated : booking));
    setStatus("Payment status updated.");
  }

  async function updateBookingStatus(nextStatus: string) {
    if (!selected) return;

    const response = await fetch(`/api/admin/bookings/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateBookingStatus", status: nextStatus }),
    });

    if (!response.ok) {
      setStatus("Unable to update booking status.");
      return;
    }

    const data = await response.json();
    const updated = { ...selected, status: data.status };
    setSelected(updated);
    setBookings((current) => current.map((booking) => booking.id === updated.id ? updated : booking));
    setStatus("Booking status updated.");
  }

  async function addPaymentSchedule() {
    if (!selected) return;

    const response = await fetch(`/api/admin/bookings/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addPaymentSchedule", ...newPayment, amount: Number(newPayment.amount) }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setStatus(data?.error ?? "Unable to add payment schedule.");
      return;
    }

    const data = await response.json();
    const updated = { ...selected, paymentSchedule: data.paymentSchedule };
    setSelected(updated);
    setBookings((current) => current.map((booking) => booking.id === updated.id ? updated : booking));
    setNewPayment({ label: "", amount: "", dueDate: "" });
    setStatus("Payment schedule added.");
  }

  function linkDocumentBin() {
    if (!selected) return;
    window.location.href = `/admin/documents?createDocumentBin=1&bookingId=${encodeURIComponent(selected.id)}`;
  }

  async function unlinkDocumentBin() {
    if (!selected || !documentBin) return;
    if (!window.confirm("Unlink this Document Bin from the booking? The linked Document Bin and its stored documents will be deleted.")) return;

    const response = await fetch(`/api/admin/bookings/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unlinkDocumentBin" }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setStatus(data?.error ?? "Unable to unlink document bin.");
      return;
    }

    const updated = { ...selected, documentBinId: "" };
    setSelected(updated);
    setBookings((current) => current.map((booking) => booking.id === updated.id ? updated : booking));
    setDocumentBin(null);
    setStatus("Document bin unlinked and deleted.");
  }

  async function copyDocumentBinLink() {
    if (!documentBin) return;
    await navigator.clipboard.writeText(documentBinLink(documentBin));
    setStatus("Document bin link copied.");
  }

  function openDocumentBinLink() {
    if (!documentBin) return;
    const url = documentBinLink(documentBin);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openDocumentBinDetails() {
    if (!documentBin) return;
    window.location.href = `/admin/documents?documentBinId=${encodeURIComponent(documentBin.id)}`;
  }

  async function sendConfirmationEmail() {
    if (!selected || sendingConfirmation) return;

    setSendingConfirmation(true);
    const response = await fetch(`/api/admin/bookings/${selected.id}/confirmation-email`, { method: "POST" });
    setSendingConfirmation(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setStatus(data?.error ?? "Unable to send confirmation email.");
      return;
    }

    setStatus("Confirmation email sent successfully.");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-viaje-red">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-viaje-navy">Bookings</h1>
      </div>

      {status && <p className="rounded-[8px] border border-viaje-line bg-white p-3 text-sm text-viaje-soft">{status}</p>}

      <Card>
        <CardHeader><CardTitle>All Bookings</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead><TR><TH>Contact Person</TH><TH>Reference Number</TH><TH>Date of Transaction</TH><TH>Time of Transaction</TH><TH>Package Tour</TH><TH>Selected Departure</TH><TH>Status</TH></TR></THead>
            <TBody>
              {loading && <TR><TD colSpan={7}>Loading bookings...</TD></TR>}
              {!loading && !bookings.length && <TR><TD colSpan={7}>No bookings yet.</TD></TR>}
              {!loading && bookings.map((booking) => (
                <TR key={booking.id} onClick={() => openBooking(booking)} className="cursor-pointer">
                  <TD>{contactName(booking)}</TD>
                  <TD>{booking.reference ?? booking.id}</TD>
                  <TD>{dateLabel(booking.createdAt)}</TD>
                  <TD>{timeLabel(booking.createdAt)}</TD>
                  <TD>{booking.packageTitle ?? booking.packageSlug ?? booking.packageId ?? "N/A"}</TD>
                  <TD>{dateLabel(booking.bookingSelections?.selectedDeparture?.startDate)}</TD>
                  <TD><StatusBadge status={booking.status ?? "pending"} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-viaje-navy/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[8px] bg-white shadow-[0_28px_80px_-30px_rgba(0,0,0,0.65)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-viaje-line bg-white px-5 py-4">
              <div>
                <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-viaje-red">{selected.reference ?? selected.id}</p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-viaje-navy">Booking Details</h2>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={closeBooking} aria-label="Close booking details">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardHeader><CardTitle>Package / Booking Information</CardTitle></CardHeader>
                <CardContent className="grid gap-3 text-sm md:grid-cols-2">
                  <p><span className="text-viaje-soft">Package</span><br /><strong>{selected.packageTitle ?? selected.packageSlug ?? selected.packageId ?? "N/A"}</strong></p>
                  <p><span className="text-viaje-soft">Pax</span><br /><strong>{selected.bookingSelections?.pax ?? selected.guests?.length ?? 0}</strong></p>
                  <p><span className="text-viaje-soft">Selected Departure</span><br /><strong>{dateLabel(selected.bookingSelections?.selectedDeparture?.startDate)} - {dateLabel(selected.bookingSelections?.selectedDeparture?.endDate)}</strong></p>
                  <p><span className="text-viaje-soft">Selected Add-on</span><br /><strong>{selected.bookingSelections?.selectedAddon?.label ?? selected.addonId ?? "None"}</strong></p>
                  <label className="grid gap-1.5">
                    <span className="text-viaje-soft">Booking Status</span>
                    <select value={selected.status ?? "PENDING FOR VERIFICATION"} onChange={(event) => updateBookingStatus(event.target.value)} className="h-10 rounded-[8px] border border-viaje-line bg-white px-3 text-sm text-viaje-ink">
                      {bookingStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                  <p><span className="text-viaje-soft">Payment Status</span><br /><StatusBadge status={selected.paymentStatus ?? "pending"} /></p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Payment Summary</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4"><span>Total Booking Amount</span><strong>{formatPeso(totalAmount)}</strong></div>
                  <div className="flex justify-between gap-4"><span>Total Paid</span><strong>{formatPeso(totalPaid)}</strong></div>
                  <div className="flex justify-between gap-4"><span>Remaining Balance</span><strong>{formatPeso(remainingBalance)}</strong></div>
                  <div className="flex justify-between gap-4"><span>Payment Type</span><strong>{selected.paymentType ?? "Full Payment"}</strong></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Contact Person</CardTitle></CardHeader>
                <CardContent className="grid gap-3 text-sm md:grid-cols-2">
                  <p><span className="text-viaje-soft">Name</span><br /><strong>{contactName(selected)}</strong></p>
                  <p><span className="text-viaje-soft">Mobile</span><br /><strong>{selected.groupContact?.mobileNumber ?? "N/A"}</strong></p>
                  <p><span className="text-viaje-soft">Email</span><br /><strong>{selected.groupContact?.emailAddress ?? "N/A"}</strong></p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Payment Information</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p><span className="text-viaje-soft">Payment Method</span><br /><strong>{selected.paymentInfo?.method ?? "N/A"}</strong></p>
                  <p><span className="text-viaje-soft">Payment Method Reference Number</span><br /><strong>{selected.paymentInfo?.paymentMethodReferenceNumber ?? "N/A"}</strong></p>
                  <p><span className="text-viaje-soft">Transaction Reference</span><br /><strong>{selected.paymentInfo?.transactionReferenceNumber ?? "N/A"}</strong></p>
                  <p><span className="text-viaje-soft">Submitted Amount</span><br /><strong>{formatPeso(Number(selected.paymentInfo?.amountSubmitted ?? selected.amountPaid ?? 0))}</strong></p>
                  <p><span className="text-viaje-soft">Payment Date</span><br /><strong>{dateLabel(selected.paymentInfo?.paymentDate)}</strong></p>
                  {selected.paymentInfo?.receiptUrl ? (
                    <a href={selected.paymentInfo.receiptUrl} target="_blank" className="block w-fit">
                      <img src={selected.paymentInfo.receiptUrl} alt="Proof of payment" className="h-40 w-40 rounded-[8px] border border-viaje-line object-cover" />
                    </a>
                  ) : (
                    <p><span className="text-viaje-soft">Proof of Payment</span><br /><strong>N/A</strong></p>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Guests</CardTitle></CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {(selected.guests ?? []).map((guest, index) => (
                    <div key={index} className="rounded-[8px] border border-viaje-line bg-viaje-paper p-4 text-sm">
                      <strong className="text-viaje-navy">Guest {index + 1}: {String(guest.firstName ?? "")} {String(guest.lastName ?? "")}</strong>
                      <p className="mt-1 text-viaje-soft">Nationality: {String(guest.nationality ?? "N/A")}</p>
                      <p className="text-viaje-soft">Passport: {String(guest.passportNumber ?? "N/A")}</p>
                      <p className="text-viaje-soft">PWD: {guest.isPwd ? "Yes" : "No"}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Payment Schedule</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <Table>
                    <THead><TR><TH>Payment</TH><TH>Amount</TH><TH>Due Date</TH><TH>Status</TH></TR></THead>
                    <TBody>
                      {selectedSchedule.map((item) => (
                        <TR key={item.id}>
                          <TD>{item.label}</TD>
                          <TD>{formatPeso(Number(item.amount || 0))}</TD>
                          <TD>{dateLabel(item.dueDate)}</TD>
                          <TD>
                            <select value={item.status} onChange={(event) => updateScheduleStatus(item.id, event.target.value)} className="h-10 rounded-[8px] border border-viaje-line bg-white px-3 text-sm text-viaje-ink">
                              {paymentStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                            {!["verified", "paid"].includes(item.status.toLowerCase()) && (
                              <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => setStatus(`Payment link UI ready for ${item.label}.`)}>
                                <LinkIcon className="h-3.5 w-3.5" /> Send Payment Link
                              </Button>
                            )}
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                  <div className="grid gap-3 rounded-[8px] border border-viaje-line bg-viaje-paper p-4 md:grid-cols-[1fr_160px_160px_auto]">
                    <Input placeholder="Payment Name" value={newPayment.label} onChange={(event) => setNewPayment((current) => ({ ...current, label: event.target.value }))} />
                    <Input type="number" min="0" placeholder="Amount" value={newPayment.amount} onChange={(event) => setNewPayment((current) => ({ ...current, amount: event.target.value }))} />
                    <Input type="date" value={newPayment.dueDate} onChange={(event) => setNewPayment((current) => ({ ...current, dueDate: event.target.value }))} />
                    <Button type="button" onClick={addPaymentSchedule}><Plus className="h-4 w-4" />Add Payment Schedule</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  {!selected.documentBinId && (
                    <div className="rounded-[8px] border border-dashed border-viaje-line bg-viaje-paper p-5 text-sm">
                      <p className="mb-4 text-viaje-soft">No Document Bin is linked to this booking yet.</p>
                      <Button type="button" onClick={linkDocumentBin}><FileText className="h-4 w-4" />Link Document Bin</Button>
                    </div>
                  )}

                  {selected.documentBinId && documentBinLoading && (
                    <p className="rounded-[8px] border border-viaje-line bg-viaje-paper p-4 text-sm text-viaje-soft">Loading linked document bin...</p>
                  )}

                  {selected.documentBinId && !documentBinLoading && documentBin && (
                    <div className="space-y-4 rounded-[8px] border border-viaje-line bg-viaje-paper p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-viaje-red">{documentBin.referenceNumber}</p>
                          <h3 className="mt-1 font-serif text-xl font-semibold text-viaje-navy">{documentBin.purpose || "Document Bin"}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={copyDocumentBinLink}><Copy className="h-3.5 w-3.5" />Copy Link</Button>
                          <Button type="button" size="sm" variant="outline" onClick={openDocumentBinLink}><ExternalLink className="h-3.5 w-3.5" />Open Link</Button>
                          <Button type="button" size="sm" onClick={openDocumentBinDetails}><FileText className="h-3.5 w-3.5" />Open Full Details</Button>
                          <Button type="button" size="sm" variant="outline" className="text-viaje-red" onClick={unlinkDocumentBin}><Trash2 className="h-3.5 w-3.5" />Unlink Document Bin</Button>
                        </div>
                      </div>
                      <div className="grid gap-3 text-sm md:grid-cols-3">
                        <p><span className="text-viaje-soft">Status</span><br /><StatusBadge status={documentBin.status} /></p>
                        <p><span className="text-viaje-soft">Progress</span><br /><strong>{documentProgressLabel(documentBin)}</strong></p>
                        <p><span className="text-viaje-soft">Public Link</span><br /><strong>{documentBin.publicToken ? "Active" : "Not available"}</strong></p>
                      </div>
                      <DocumentBinProgressIndicator value={documentProgressPercent(documentBin)} />
                      <Table>
                        <THead><TR><TH>Document</TH><TH>Status</TH><TH>Uploaded Files</TH></TR></THead>
                        <TBody>
                          {!documentBin.requirements.length && <TR><TD colSpan={3}>No document requirements yet.</TD></TR>}
                          {documentBin.requirements.map((requirement) => (
                            <TR key={requirement.id}>
                              <TD>{documentName(requirement)}</TD>
                              <TD><StatusBadge status={requirement.status} /></TD>
                              <TD>{requirement.uploads.length ? `${requirement.uploads.length} uploaded` : <span className="text-viaje-soft">Pending upload</span>}</TD>
                            </TR>
                          ))}
                        </TBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" onClick={sendConfirmationEmail} disabled={sendingConfirmation}>
                    <Mail className="h-4 w-4" />{sendingConfirmation ? "Sending..." : "Send Confirmation Email & Itinerary"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
