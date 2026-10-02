"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, ExternalLink, FileDown, Mail, Plus, ReceiptText, Save, Send, Trash2, X } from "lucide-react";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { emailPattern, isValidContactNumber, normalizeContactNumber } from "@/lib/document-bins";
import { publicAppUrl } from "@/lib/public-url";
import { formatDate, formatPeso } from "@/lib/utils";

const itemTypes = [
  "Flight Fee",
  "Hotel Accommodation",
  "Boat Tickets",
  "PSA Assistance",
  "Car Rentals",
  "Taxes & Processing",
  "Other",
] as const;

type QuotationItemType = typeof itemTypes[number];

type QuotationItem = {
  id: string;
  quotationId: string;
  type: QuotationItemType;
  customName: string;
  itemName: string;
  remarks: string;
  amount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type Quotation = {
  id: string;
  referenceNumber: string;
  publicToken: string;
  clientName: string;
  email: string;
  contactNumber: string;
  status: "DRAFT" | "FINALIZED";
  totalAmount: number;
  paymentToken: string;
  paymentStatus: "UNPAID" | "PENDING FOR VERIFICATION" | "VERIFIED" | "REJECTED";
  latestPaymentId: string;
  createdAt: string;
  updatedAt: string;
  finalizedAt: string;
  items: QuotationItem[];
};

const emptyQuotation: Quotation = {
  id: "",
  referenceNumber: "",
  publicToken: "",
  clientName: "",
  email: "",
  contactNumber: "+63",
  status: "DRAFT",
  totalAmount: 0,
  paymentToken: "",
  paymentStatus: "UNPAID",
  latestPaymentId: "",
  createdAt: "",
  updatedAt: "",
  finalizedAt: "",
  items: [],
};

const labelClass = "text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft";
const fieldClass = "grid gap-2";
const quotationInputClass = "h-12 bg-white px-3.5 py-3";
const inputClass = "h-12 rounded-[10px] border border-viaje-line bg-white px-3.5 py-3 text-sm text-viaje-ink outline-none focus:ring-2 focus:ring-viaje-red/20";
const errorClass = "mt-0.5 text-xs font-medium leading-5 text-viaje-red";
type QuotationErrors = Partial<Record<"clientName" | "email" | "contactNumber" | "items", string>> & {
  itemErrors: Array<Partial<Record<"customName" | "remarks" | "amount", string>>>;
};
type QuotationTouched = Partial<Record<"clientName" | "email" | "contactNumber" | "items", boolean>>;
type QuotationItemTouched = Record<string, Partial<Record<"customName" | "remarks" | "amount", boolean>>>;

function newItem(sortOrder: number): QuotationItem {
  return {
    id: `qitem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    quotationId: "",
    type: "Flight Fee",
    customName: "",
    itemName: "Flight Fee",
    remarks: "",
    amount: 0,
    sortOrder,
    createdAt: "",
    updatedAt: "",
  };
}

function itemName(item: QuotationItem) {
  return item.type === "Other" ? item.customName.trim() || "Other" : item.type;
}

export function QuotationBuilderManagement() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState("");
  const [status, setStatus] = useState("");
  const [modalError, setModalError] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentCursor, setCurrentCursor] = useState("");
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState("");
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(1);
  const [totalQuotations, setTotalQuotations] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);
  const [quotationTouched, setQuotationTouched] = useState<QuotationTouched>({});
  const [quotationItemTouched, setQuotationItemTouched] = useState<QuotationItemTouched>({});
  const [quotationSubmitted, setQuotationSubmitted] = useState(false);
  const searchMounted = useRef(false);

  useEffect(() => {
    if (!searchMounted.current) {
      searchMounted.current = true;
      return;
    }

    const timeout = window.setTimeout(() => {
      setCursorStack([]);
      setCurrentCursor("");
      setPage(1);
      setDebouncedQuery(query.trim());
      setRefreshKey((current) => current + 1);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (currentCursor) params.set("cursor", currentCursor);
    if (debouncedQuery) params.set("search", debouncedQuery);
    fetch(`/api/admin/quotations${params.toString() ? `?${params}` : ""}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load quotations")))
      .then((data) => {
        setQuotations(data.quotations ?? []);
        setNextCursor(data.nextCursor ?? "");
        setHasNext(Boolean(data.hasNext));
        setTotalQuotations(Number(data.total ?? 0));
        setPageSize(Number(data.pageSize ?? 10));
      })
      .catch(() => setStatus("Unable to load quotations."))
      .finally(() => setLoading(false));
  }, [currentCursor, debouncedQuery, refreshKey]);

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
      const next = [...current];
      setCurrentCursor(next.pop() ?? "");
      return next;
    });
  }

  const editingTotal = useMemo(() => (editing?.items ?? []).reduce((sum, item) => sum + Number(item.amount || 0), 0), [editing]);

  function startCreate() {
    setStatus("");
    setModalError("");
    setQuotationTouched({});
    setQuotationItemTouched({});
    setQuotationSubmitted(false);
    setEditing({ ...emptyQuotation, items: [newItem(0)] });
  }

  async function startEdit(quotation: Quotation) {
    setStatus("");
    setModalError("");
    setQuotationTouched({});
    setQuotationItemTouched({});
    setQuotationSubmitted(false);
    const response = await fetch(`/api/admin/quotations/${quotation.id}`);
    if (!response.ok) {
      setStatus("Unable to load quotation details.");
      return;
    }
    const data = await response.json();
    setEditing(data.quotation);
  }

  function closeModal() {
    setEditing(null);
    setModalError("");
    setQuotationTouched({});
    setQuotationItemTouched({});
    setQuotationSubmitted(false);
  }

  function updateEditing(values: Partial<Quotation>) {
    setEditing((current) => current ? { ...current, ...values } : current);
  }

  function touchQuotationField(field: keyof QuotationTouched) {
    setQuotationTouched((current) => ({ ...current, [field]: true }));
  }

  function touchQuotationItemField(itemId: string, field: "customName" | "remarks" | "amount") {
    setQuotationItemTouched((current) => ({
      ...current,
      [itemId]: { ...current[itemId], [field]: true },
    }));
  }

  function updateItem(index: number, values: Partial<QuotationItem>) {
    setEditing((current) => {
      if (!current) return current;
      const items = [...current.items];
      items[index] = { ...items[index], ...values };
      if (values.type && values.type !== "Other") items[index].customName = "";
      items[index].itemName = itemName(items[index]);
      return { ...current, items };
    });
  }

  function removeItem(index: number) {
    setEditing((current) => current ? { ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index).map((item, sortOrder) => ({ ...item, sortOrder })) } : current);
  }

  function validateQuotationForm(quotation: Quotation | null): QuotationErrors {
    const errors: QuotationErrors = { itemErrors: [] };
    if (!quotation) return errors;
    const email = quotation.email.trim();

    if (!quotation.clientName.trim()) errors.clientName = "Client name is required.";
    if (!email) errors.email = "Email address is required.";
    else if (!emailPattern.test(email)) errors.email = "Enter a valid email address.";
    if (!quotation.contactNumber.trim()) errors.contactNumber = "Contact number is required.";
    else if (!isValidContactNumber(quotation.contactNumber)) errors.contactNumber = "Enter a valid +63 mobile number.";
    if (!quotation.items.length) errors.items = "At least one quotation item is required.";

    errors.itemErrors = quotation.items.map((item) => {
      const itemErrors: Partial<Record<"customName" | "remarks" | "amount", string>> = {};
      if (item.type === "Other" && !item.customName.trim()) itemErrors.customName = "Custom item name is required.";
      if (!item.remarks.trim()) itemErrors.remarks = "Remarks are required.";
      if (Number(item.amount || 0) <= 0) itemErrors.amount = "Amount must be greater than zero.";
      return itemErrors;
    });

    return errors;
  }

  const quotationErrors = useMemo(() => validateQuotationForm(editing), [editing]);
  const quotationInvalid = Object.entries(quotationErrors).some(([key, value]) => {
    if (key === "itemErrors") return quotationErrors.itemErrors.some((item) => Object.values(item).some(Boolean));
    return Boolean(value);
  });

  async function saveQuotation() {
    if (!editing) return;
    setQuotationSubmitted(true);
    if (quotationInvalid) return;

    setModalError("");
    setSaving(true);
    const isNew = !editing.id;
    const response = await fetch(isNew ? "/api/admin/quotations" : `/api/admin/quotations/${editing.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editing, items: editing.items.map((item, sortOrder) => ({ ...item, itemName: itemName(item), sortOrder })) }),
    });
    setSaving(false);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setModalError(data?.error ?? "Unable to save quotation.");
      return;
    }

    if (isNew) setRefreshKey((current) => current + 1);
    else setQuotations((current) => current.map((quotation) => quotation.id === data.quotation.id ? data.quotation : quotation));
    closeModal();
    setStatus("Quotation saved.");
  }

  async function removeQuotation(quotation: Quotation) {
    if (!window.confirm("Permanently delete this quotation?\nThis action cannot be undone.")) return false;

    const response = await fetch(`/api/admin/quotations/${quotation.id}`, { method: "DELETE" });
    if (!response.ok) {
      setStatus("Unable to delete quotation.");
      return false;
    }
    setRefreshKey((current) => current + 1);
    setStatus("Quotation deleted.");
    return true;
  }

  async function quotationAction(quotation: Quotation, action: "finalize" | "generatePaymentLink") {
    const response = await fetch(`/api/admin/quotations/${quotation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(data?.error ?? "Unable to update quotation.");
      return;
    }
    setQuotations((current) => current.map((item) => item.id === data.quotation.id ? data.quotation : item));
    setEditing((current) => current?.id === data.quotation.id ? data.quotation : current);
    setStatus(action === "finalize" ? "Quotation finalized." : "Payment link generated.");
  }

  async function sendEmail(quotation: Quotation) {
    if (sendingId) return;
    setSendingId(quotation.id);
    const response = await fetch(`/api/admin/quotations/${quotation.id}/send-email`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setSendingId("");
    setStatus(response.ok ? "Quotation email sent successfully." : data?.error ?? "Unable to send quotation email.");
  }

  function quotationUrl(quotation: Quotation) {
    return publicAppUrl(`/quotation/${quotation.publicToken}`);
  }

  function paymentUrl(quotation: Quotation) {
    return quotation.paymentToken ? publicAppUrl(`/payment/quotation/${quotation.paymentToken}`) : "";
  }

  function downloadQuotation(quotation: Quotation) {
    window.open(`/api/admin/quotations/${encodeURIComponent(quotation.id)}/pdf`, "_blank", "noopener,noreferrer");
  }

  function downloadAcknowledgementReceipt(quotation: Quotation) {
    window.open(`/api/admin/quotations/${encodeURIComponent(quotation.id)}/acknowledgement-receipt-pdf`, "_blank", "noopener,noreferrer");
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setStatus("Link copied.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-viaje-red">Admin</p>
          <h1 className="mt-2 text-3xl font-bold text-viaje-navy">Quotation Builder</h1>
        </div>
        <Button type="button" onClick={startCreate}><Plus className="h-4 w-4" />Create Quotation</Button>
      </div>

      {status && <p className="rounded-[8px] border border-viaje-line bg-white p-3 text-sm text-viaje-soft">{status}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Saved Quotations</CardTitle>
          <Input placeholder="Search reference, client, or email" value={query} onChange={(event) => setQuery(event.target.value)} className="mt-3 max-w-md" />
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Reference</TH>
                <TH>Client</TH>
                <TH>Created</TH>
                <TH>Total</TH>
                <TH>Status</TH>
                <TH>Payment</TH>
              </TR>
            </THead>
            <TBody>
              {loading && <TR><TD colSpan={6}>Loading quotations...</TD></TR>}
              {!loading && !quotations.length && <TR><TD colSpan={6}>No quotations yet.</TD></TR>}
              {!loading && quotations.map((quotation) => (
                <TR key={quotation.id} onClick={() => startEdit(quotation)} className="cursor-pointer hover:bg-viaje-paperAlt/60">
                  <TD className="font-semibold text-viaje-navy">{quotation.referenceNumber}</TD>
                  <TD>
                    <div className="font-medium text-viaje-ink">{quotation.clientName}</div>
                    <div className="text-xs text-viaje-soft">{quotation.email}</div>
                  </TD>
                  <TD>{quotation.createdAt ? formatDate(quotation.createdAt) : "-"}</TD>
                  <TD>{formatPeso(quotation.totalAmount)}</TD>
                  <TD><StatusBadge status={quotation.status} /></TD>
                  <TD><StatusBadge status={quotation.paymentStatus} /></TD>
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
            total={totalQuotations}
            itemCount={quotations.length}
            onPrevious={previousPage}
            onNext={nextPage}
          />
        </CardContent>
      </Card>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-viaje-navy/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[8px] bg-white shadow-[0_28px_80px_-30px_rgba(0,0,0,0.65)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-viaje-line bg-white px-5 py-4">
              <h2 className="font-serif text-2xl font-semibold text-viaje-navy">{editing.id ? `Edit ${editing.referenceNumber}` : "Create Quotation"}</h2>
              <Button type="button" variant="outline" size="icon" onClick={closeModal} aria-label="Close quotation modal"><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid gap-6 p-5">
              {editing.id && (
                <Card>
                  <CardHeader><CardTitle>Quotation Actions</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => downloadQuotation(editing)}><FileDown className="h-3.5 w-3.5" />Download Quotation</Button>
                      {editing.status === "FINALIZED" && (
                        <Button type="button" size="sm" variant="outline" onClick={() => downloadAcknowledgementReceipt(editing)}><FileDown className="h-3.5 w-3.5" />Download Acknowledgement Receipt</Button>
                      )}
                      <Button type="button" size="sm" variant="outline" onClick={() => copy(quotationUrl(editing))}><Copy className="h-3.5 w-3.5" />Copy Client Link</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => window.open(quotationUrl(editing), "_blank", "noopener,noreferrer")}><ExternalLink className="h-3.5 w-3.5" />Open Client Link</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => sendEmail(editing)} disabled={sendingId === editing.id}>
                        <Mail className="h-3.5 w-3.5" />{sendingId === editing.id ? "Sending..." : "Email to Client"}
                      </Button>
                      {editing.status !== "FINALIZED" && <Button type="button" size="sm" variant="outline" onClick={() => quotationAction(editing, "finalize")}><Send className="h-3.5 w-3.5" />Finalize</Button>}
                      {editing.status === "FINALIZED" && !editing.paymentToken && <Button type="button" size="sm" variant="outline" onClick={() => quotationAction(editing, "generatePaymentLink")}><ReceiptText className="h-3.5 w-3.5" />Payment Link</Button>}
                      {paymentUrl(editing) && <Button type="button" size="sm" variant="outline" onClick={() => window.open(paymentUrl(editing), "_blank", "noopener,noreferrer")}><ExternalLink className="h-3.5 w-3.5" />Open Payment Link</Button>}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-viaje-red"
                        onClick={async () => {
                          if (await removeQuotation(editing)) closeModal();
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader><CardTitle>Client Information</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <label className={fieldClass}>
                    <span className={labelClass}>Client Name</span>
                    <Input required className={quotationInputClass} value={editing.clientName} onBlur={() => touchQuotationField("clientName")} onChange={(event) => updateEditing({ clientName: event.target.value })} />
                    {(quotationSubmitted || quotationTouched.clientName) && quotationErrors.clientName && <span className={errorClass}>{quotationErrors.clientName}</span>}
                  </label>
                  <label className={fieldClass}>
                    <span className={labelClass}>Email</span>
                    <Input required type="email" className={quotationInputClass} value={editing.email} onBlur={() => touchQuotationField("email")} onChange={(event) => updateEditing({ email: event.target.value })} />
                    {(quotationSubmitted || quotationTouched.email) && quotationErrors.email && <span className={errorClass}>{quotationErrors.email}</span>}
                  </label>
                  <label className={fieldClass}>
                    <span className={labelClass}>Contact Number</span>
                    <Input required className={quotationInputClass} value={editing.contactNumber || "+63"} onBlur={() => touchQuotationField("contactNumber")} onChange={(event) => updateEditing({ contactNumber: normalizeContactNumber(event.target.value) })} />
                    {(quotationSubmitted || quotationTouched.contactNumber) && quotationErrors.contactNumber && <span className={errorClass}>{quotationErrors.contactNumber}</span>}
                  </label>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
                  <CardTitle>Quotation Items</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={() => updateEditing({ items: [...editing.items, newItem(editing.items.length)] })}>
                    <Plus className="h-3.5 w-3.5" />Add Quotation Item
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(quotationSubmitted || quotationTouched.items) && quotationErrors.items && <p className="text-sm font-medium text-viaje-red">{quotationErrors.items}</p>}
                  {editing.items.map((item, index) => {
                    const itemErrors = quotationErrors.itemErrors[index] ?? {};
                    const touched = quotationItemTouched[item.id] ?? {};
                    return (
                      <div key={item.id} className="grid gap-4 rounded-[10px] border border-viaje-line bg-viaje-paper p-4 lg:grid-cols-[200px_minmax(0,1fr)_160px_44px] lg:items-start">
                        <label className={fieldClass}>
                          <span className={labelClass}>Service / Item Type</span>
                          <select value={item.type} onChange={(event) => updateItem(index, { type: event.target.value as QuotationItemType })} className={inputClass}>
                            {itemTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                          </select>
                        </label>
                        <label className={fieldClass}>
                          <span className={labelClass}>{item.type === "Other" ? "Custom Item Name" : "Remarks"}</span>
                          <Input
                            className={quotationInputClass}
                            value={item.type === "Other" ? item.customName : item.remarks}
                            onBlur={() => touchQuotationItemField(item.id, item.type === "Other" ? "customName" : "remarks")}
                            onChange={(event) => updateItem(index, item.type === "Other" ? { customName: event.target.value } : { remarks: event.target.value })}
                          />
                          {item.type === "Other" ? (
                            (quotationSubmitted || touched.customName) && itemErrors.customName && <span className={errorClass}>{itemErrors.customName}</span>
                          ) : (
                            (quotationSubmitted || touched.remarks) && itemErrors.remarks && <span className={errorClass}>{itemErrors.remarks}</span>
                          )}
                        </label>
                        <label className={fieldClass}>
                          <span className={labelClass}>Amount</span>
                          <Input type="number" min="0" step="1" className={quotationInputClass} value={item.amount || ""} onBlur={() => touchQuotationItemField(item.id, "amount")} onChange={(event) => updateItem(index, { amount: Number(event.target.value) })} />
                          {(quotationSubmitted || touched.amount) && itemErrors.amount && <span className={errorClass}>{itemErrors.amount}</span>}
                        </label>
                        <button type="button" onClick={() => removeItem(index)} className="mt-7 flex h-10 w-10 items-center justify-center rounded-full text-viaje-red hover:bg-white" aria-label="Remove quotation item">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {item.type === "Other" && (
                          <label className={`${fieldClass} lg:col-span-4`}>
                            <span className={labelClass}>Remarks</span>
                            <Input className={quotationInputClass} value={item.remarks} onBlur={() => touchQuotationItemField(item.id, "remarks")} onChange={(event) => updateItem(index, { remarks: event.target.value })} />
                            {(quotationSubmitted || touched.remarks) && itemErrors.remarks && <span className={errorClass}>{itemErrors.remarks}</span>}
                          </label>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex justify-end rounded-[10px] border border-viaje-line bg-white p-4 text-lg font-bold text-viaje-navy">
                    Grand Total: {formatPeso(editingTotal)}
                  </div>
                </CardContent>
              </Card>

              {modalError && <p className="rounded-[8px] border border-viaje-line bg-viaje-paper p-3 text-sm font-medium text-viaje-red">{modalError}</p>}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="button" onClick={saveQuotation} disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving..." : "Save Quotation"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
