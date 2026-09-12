"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, Mail, Pencil, Plus, ReceiptText, Save, Send, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
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
  contactNumber: "",
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
const fieldClass = "grid gap-1.5";
const inputClass = "h-12 rounded-[10px] border border-viaje-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-viaje-red/20";

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

function publicBaseUrl() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export function QuotationBuilderManagement() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/admin/quotations")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load quotations")))
      .then((data) => setQuotations(data.quotations ?? []))
      .catch(() => setStatus("Unable to load quotations."))
      .finally(() => setLoading(false));
  }, []);

  const filteredQuotations = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return quotations;
    return quotations.filter((quotation) => [
      quotation.referenceNumber,
      quotation.clientName,
      quotation.email,
    ].some((value) => value.toLowerCase().includes(needle)));
  }, [query, quotations]);

  const editingTotal = useMemo(() => (editing?.items ?? []).reduce((sum, item) => sum + Number(item.amount || 0), 0), [editing]);

  function startCreate() {
    setStatus("");
    setEditing({ ...emptyQuotation, items: [newItem(0)] });
  }

  async function startEdit(quotation: Quotation) {
    setStatus("");
    const response = await fetch(`/api/admin/quotations/${quotation.id}`);
    if (!response.ok) {
      setStatus("Unable to load quotation details.");
      return;
    }
    const data = await response.json();
    setEditing(data.quotation);
  }

  function updateEditing(values: Partial<Quotation>) {
    setEditing((current) => current ? { ...current, ...values } : current);
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

  async function saveQuotation() {
    if (!editing) return;

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
      setStatus(data?.error ?? "Unable to save quotation.");
      return;
    }

    setQuotations((current) => {
      if (isNew) return [data.quotation, ...current];
      return current.map((quotation) => quotation.id === data.quotation.id ? data.quotation : quotation);
    });
    setEditing(null);
    setStatus("Quotation saved.");
  }

  async function removeQuotation(quotation: Quotation) {
    if (!window.confirm("Permanently delete this quotation?\nThis action cannot be undone.")) return;

    const response = await fetch(`/api/admin/quotations/${quotation.id}`, { method: "DELETE" });
    if (!response.ok) {
      setStatus("Unable to delete quotation.");
      return;
    }
    setQuotations((current) => current.filter((item) => item.id !== quotation.id));
    setStatus("Quotation deleted.");
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
    return `${publicBaseUrl()}/quotation/${quotation.publicToken}`;
  }

  function paymentUrl(quotation: Quotation) {
    return quotation.paymentToken ? `${publicBaseUrl()}/payment/quotation/${quotation.paymentToken}` : "";
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

      {editing && (
        <Card>
          <CardHeader><CardTitle>{editing.id ? `Edit ${editing.referenceNumber}` : "Create Quotation"}</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <label className={fieldClass}><span className={labelClass}>Client Name</span><Input required value={editing.clientName} onChange={(event) => updateEditing({ clientName: event.target.value })} /></label>
              <label className={fieldClass}><span className={labelClass}>Email</span><Input required type="email" value={editing.email} onChange={(event) => updateEditing({ email: event.target.value })} /></label>
              <label className={fieldClass}><span className={labelClass}>Contact Number</span><Input required value={editing.contactNumber} onChange={(event) => updateEditing({ contactNumber: event.target.value })} /></label>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-serif text-xl font-semibold text-viaje-navy">Quotation Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => updateEditing({ items: [...editing.items, newItem(editing.items.length)] })}>
                  <Plus className="h-3.5 w-3.5" />Add Quotation Item
                </Button>
              </div>
              {editing.items.map((item, index) => (
                <div key={item.id} className="grid gap-3 rounded-[10px] border border-viaje-line bg-viaje-paper p-4 lg:grid-cols-[180px_1fr_140px_40px]">
                  <label className={fieldClass}>
                    <span className={labelClass}>Service / Item Type</span>
                    <select value={item.type} onChange={(event) => updateItem(index, { type: event.target.value as QuotationItemType })} className={inputClass}>
                      {itemTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </label>
                  <label className={fieldClass}>
                    <span className={labelClass}>{item.type === "Other" ? "Custom Item Name" : "Remarks"}</span>
                    <Input value={item.type === "Other" ? item.customName : item.remarks} onChange={(event) => updateItem(index, item.type === "Other" ? { customName: event.target.value } : { remarks: event.target.value })} />
                  </label>
                  <label className={fieldClass}>
                    <span className={labelClass}>Amount</span>
                    <Input type="number" min="0" step="1" value={item.amount || ""} onChange={(event) => updateItem(index, { amount: Number(event.target.value) })} />
                  </label>
                  <button type="button" onClick={() => removeItem(index)} className="mt-6 flex h-10 w-10 items-center justify-center rounded-full text-viaje-red hover:bg-white" aria-label="Remove quotation item">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {item.type === "Other" && (
                    <label className={`${fieldClass} lg:col-span-4`}>
                      <span className={labelClass}>Remarks</span>
                      <Input value={item.remarks} onChange={(event) => updateItem(index, { remarks: event.target.value })} />
                    </label>
                  )}
                </div>
              ))}
              <div className="flex justify-end rounded-[10px] border border-viaje-line bg-white p-4 text-lg font-bold text-viaje-navy">
                Grand Total: {formatPeso(editingTotal)}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={saveQuotation} disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving..." : "Save Quotation"}</Button>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {loading && <TR><TD colSpan={7}>Loading quotations...</TD></TR>}
              {!loading && !filteredQuotations.length && <TR><TD colSpan={7}>No quotations yet.</TD></TR>}
              {!loading && filteredQuotations.map((quotation) => (
                <TR key={quotation.id}>
                  <TD className="font-semibold text-viaje-navy">{quotation.referenceNumber}</TD>
                  <TD>
                    <div className="font-medium text-viaje-ink">{quotation.clientName}</div>
                    <div className="text-xs text-viaje-soft">{quotation.email}</div>
                  </TD>
                  <TD>{quotation.createdAt ? formatDate(quotation.createdAt) : "-"}</TD>
                  <TD>{formatPeso(quotation.totalAmount)}</TD>
                  <TD><StatusBadge status={quotation.status} /></TD>
                  <TD><StatusBadge status={quotation.paymentStatus} /></TD>
                  <TD>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => startEdit(quotation)}><Pencil className="h-3.5 w-3.5" />Edit</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => copy(quotationUrl(quotation))}><Copy className="h-3.5 w-3.5" />Copy</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => window.open(quotationUrl(quotation), "_blank", "noopener,noreferrer")}><ExternalLink className="h-3.5 w-3.5" />Open</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => sendEmail(quotation)} disabled={sendingId === quotation.id}>
                        <Mail className="h-3.5 w-3.5" />{sendingId === quotation.id ? "Sending..." : "Email to Client"}
                      </Button>
                      {quotation.status !== "FINALIZED" && <Button type="button" size="sm" variant="outline" onClick={() => quotationAction(quotation, "finalize")}><Send className="h-3.5 w-3.5" />Finalize</Button>}
                      {quotation.status === "FINALIZED" && !quotation.paymentToken && <Button type="button" size="sm" variant="outline" onClick={() => quotationAction(quotation, "generatePaymentLink")}><ReceiptText className="h-3.5 w-3.5" />Payment Link</Button>}
                      {paymentUrl(quotation) && <Button type="button" size="sm" variant="ghost" onClick={() => window.open(paymentUrl(quotation), "_blank", "noopener,noreferrer")}><ExternalLink className="h-3.5 w-3.5" />Pay</Button>}
                      <Button type="button" size="sm" variant="ghost" className="text-viaje-red" onClick={() => removeQuotation(quotation)} aria-label={`Delete ${quotation.referenceNumber}`}><Trash2 className="h-3.5 w-3.5" /></Button>
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
