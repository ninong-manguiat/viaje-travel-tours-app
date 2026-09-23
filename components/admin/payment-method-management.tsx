"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { PackageMediaField } from "@/components/admin/package-media-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { PaymentMethod } from "@/lib/payment-methods";

const emptyPaymentMethod: PaymentMethod = {
  id: "",
  bank: "",
  accountName: "",
  referenceNumber: "",
  bankLogoUrl: "",
  qrImageUrl: "",
};

const fieldClass = "grid gap-1.5";
const labelClass = "text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft";
type PaymentMethodErrors = Partial<Record<"bank" | "accountName" | "referenceNumber", string>>;

export function PaymentMethodManagement() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    fetch("/api/admin/payment-methods")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load payment methods")))
      .then((data) => setPaymentMethods(data.paymentMethods))
      .catch(() => setStatus("Unable to load payment methods."))
      .finally(() => setLoading(false));
  }, []);

  function startCreate() {
    setStatus("");
    setModalError("");
    setEditing({ ...emptyPaymentMethod });
  }

  function closeModal() {
    setEditing(null);
    setModalError("");
  }

  function validatePaymentMethodForm(method: PaymentMethod | null) {
    const errors: PaymentMethodErrors = {};
    if (!method) return errors;
    if (!method.bank.trim()) errors.bank = "Bank is required.";
    if (!method.accountName.trim()) errors.accountName = "Account name is required.";
    if (!method.referenceNumber.trim()) errors.referenceNumber = "Reference number is required.";
    return errors;
  }

  const paymentMethodErrors = useMemo(() => validatePaymentMethodForm(editing), [editing]);
  const paymentMethodInvalid = Object.values(paymentMethodErrors).some(Boolean);

  async function savePaymentMethod() {
    if (!editing) return;

    if (paymentMethodInvalid) return;

    setModalError("");
    setSaving(true);
    const isNew = !editing.id;
    const response = await fetch(isNew ? "/api/admin/payment-methods" : `/api/admin/payment-methods/${editing.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethod: editing }),
    });
    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setModalError(data?.error ?? "Unable to save payment method.");
      return;
    }

    const data = await response.json();
    setPaymentMethods((current) => {
      if (isNew) return [...current, data.paymentMethod].sort((a, b) => a.bank.localeCompare(b.bank));
      return current.map((method) => method.id === data.paymentMethod.id ? data.paymentMethod : method);
    });
    closeModal();
    setStatus("Payment method saved.");
  }

  async function removePaymentMethod(paymentMethod: PaymentMethod) {
    if (!window.confirm(`Delete ${paymentMethod.bank}?`)) return;

    const response = await fetch(`/api/admin/payment-methods/${paymentMethod.id}`, { method: "DELETE" });
    if (!response.ok) {
      setStatus("Unable to delete payment method.");
      return;
    }
    setPaymentMethods((current) => current.filter((method) => method.id !== paymentMethod.id));
    setStatus("Payment method deleted.");
  }

  function updateEditing(value: Partial<PaymentMethod>) {
    setEditing((current) => current ? { ...current, ...value } : current);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-viaje-red">Admin</p>
          <h1 className="mt-2 text-3xl font-bold text-viaje-navy">Payment Management</h1>
        </div>
        <Button type="button" onClick={startCreate}><Plus className="h-4 w-4" />New Payment Method</Button>
      </div>

      {status && <p className="rounded-[8px] border border-viaje-line bg-white p-3 text-sm text-viaje-soft">{status}</p>}

      <Card>
        <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR><TH>Logo</TH><TH>Bank</TH><TH>Account Name</TH><TH>Reference Number</TH><TH>QR Image</TH><TH /></TR>
            </THead>
            <TBody>
              {loading && <TR><TD colSpan={6}>Loading payment methods...</TD></TR>}
              {!loading && !paymentMethods.length && <TR><TD colSpan={6}>No payment methods yet.</TD></TR>}
              {!loading && paymentMethods.map((paymentMethod) => (
                <TR key={paymentMethod.id}>
                  <TD>
                    {paymentMethod.bankLogoUrl ? (
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[8px] border border-viaje-line bg-viaje-paper p-1.5">
                        <img src={paymentMethod.bankLogoUrl} alt="" className="max-h-full w-full object-contain" />
                      </div>
                    ) : (
                      <span className="text-xs text-viaje-soft">None</span>
                    )}
                  </TD>
                  <TD>{paymentMethod.bank}</TD>
                  <TD>{paymentMethod.accountName || <span className="text-xs text-viaje-soft">Not set</span>}</TD>
                  <TD>{paymentMethod.referenceNumber}</TD>
                  <TD>
                    {paymentMethod.qrImageUrl ? (
                      <div className="h-14 w-14 overflow-hidden rounded-[8px] border border-viaje-line bg-viaje-paper">
                        <img src={paymentMethod.qrImageUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <span className="text-xs text-viaje-soft">None</span>
                    )}
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => { setModalError(""); setEditing(paymentMethod); }}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button type="button" size="sm" variant="ghost" className="text-viaje-red" onClick={() => removePaymentMethod(paymentMethod)} aria-label={`Delete ${paymentMethod.bank}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-viaje-navy/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[8px] bg-white shadow-[0_28px_80px_-30px_rgba(0,0,0,0.65)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-viaje-line bg-white px-5 py-4">
              <h2 className="font-serif text-2xl font-semibold text-viaje-navy">{editing.id ? "Edit Payment Method" : "New Payment Method"}</h2>
              <Button type="button" variant="outline" size="icon" onClick={closeModal} aria-label="Close payment method modal"><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid gap-6 p-5">
              <Card>
                <CardHeader><CardTitle>Payment Method Details</CardTitle></CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-[1fr_180px_180px]">
                  <div className="grid gap-4">
                    <label className={fieldClass}>
                      <span className={labelClass}>Bank</span>
                      <Input required value={editing.bank} onChange={(event) => updateEditing({ bank: event.target.value })} />
                      {paymentMethodErrors.bank && <span className="text-xs font-medium text-viaje-red">{paymentMethodErrors.bank}</span>}
                    </label>
                    <label className={fieldClass}>
                      <span className={labelClass}>Account Name</span>
                      <Input required value={editing.accountName} onChange={(event) => updateEditing({ accountName: event.target.value })} />
                      {paymentMethodErrors.accountName && <span className="text-xs font-medium text-viaje-red">{paymentMethodErrors.accountName}</span>}
                    </label>
                    <label className={fieldClass}>
                      <span className={labelClass}>Reference Number</span>
                      <Input required value={editing.referenceNumber} onChange={(event) => updateEditing({ referenceNumber: event.target.value })} />
                      {paymentMethodErrors.referenceNumber && <span className="text-xs font-medium text-viaje-red">{paymentMethodErrors.referenceNumber}</span>}
                    </label>
                  </div>
                  <div>
                    <span className={labelClass}>Bank Logo</span>
                    <p className="mt-1 text-xs text-viaje-soft">Optional</p>
                    <div className="mt-2">
                      <PackageMediaField label="Bank Logo" folder="payment-methods/logos" value={editing.bankLogoUrl} onUploaded={(bankLogoUrl) => updateEditing({ bankLogoUrl })} />
                    </div>
                  </div>
                  <div>
                    <span className={labelClass}>QR Image</span>
                    <p className="mt-1 text-xs text-viaje-soft">Optional</p>
                    <div className="mt-2">
                      <PackageMediaField label="QR Image" folder="payment-methods" value={editing.qrImageUrl} onUploaded={(qrImageUrl) => updateEditing({ qrImageUrl })} />
                    </div>
                  </div>
                </CardContent>
              </Card>
              {modalError && <p className="rounded-[8px] border border-viaje-line bg-viaje-paper p-3 text-sm font-medium text-viaje-red">{modalError}</p>}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="button" onClick={savePaymentMethod} disabled={saving || paymentMethodInvalid}>{saving ? "Saving..." : "Save Payment Method"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
