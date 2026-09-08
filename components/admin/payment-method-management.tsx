"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PackageMediaField } from "@/components/admin/package-media-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { PaymentMethod } from "@/lib/payment-methods";

const emptyPaymentMethod: PaymentMethod = {
  id: "",
  bank: "",
  referenceNumber: "",
  qrImageUrl: "",
};

const fieldClass = "grid gap-1.5";
const labelClass = "text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft";

export function PaymentMethodManagement() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/admin/payment-methods")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load payment methods")))
      .then((data) => setPaymentMethods(data.paymentMethods))
      .catch(() => setStatus("Unable to load payment methods."))
      .finally(() => setLoading(false));
  }, []);

  function startCreate() {
    setStatus("");
    setEditing(emptyPaymentMethod);
  }

  async function savePaymentMethod() {
    if (!editing) return;

    if (!editing.bank.trim() || !editing.referenceNumber.trim() || !editing.qrImageUrl.trim()) {
      setStatus("Bank, reference number, and QR image are required.");
      return;
    }

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
      setStatus(data?.error ?? "Unable to save payment method.");
      return;
    }

    const data = await response.json();
    setPaymentMethods((current) => {
      if (isNew) return [...current, data.paymentMethod].sort((a, b) => a.bank.localeCompare(b.bank));
      return current.map((method) => method.id === data.paymentMethod.id ? data.paymentMethod : method);
    });
    setEditing(null);
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

      {editing && (
        <Card>
          <CardHeader><CardTitle>{editing.id ? "Edit Payment Method" : "New Payment Method"}</CardTitle></CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-[1fr_180px]">
            <div className="grid gap-4 md:grid-cols-2">
              <label className={fieldClass}>
                <span className={labelClass}>Bank</span>
                <Input required value={editing.bank} onChange={(event) => updateEditing({ bank: event.target.value })} />
              </label>
              <label className={fieldClass}>
                <span className={labelClass}>Reference Number</span>
                <Input required value={editing.referenceNumber} onChange={(event) => updateEditing({ referenceNumber: event.target.value })} />
              </label>
              <div className="flex flex-wrap gap-3 md:col-span-2">
                <Button type="button" onClick={savePaymentMethod} disabled={saving}>{saving ? "Saving..." : "Save Payment Method"}</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              </div>
            </div>
            <div>
              <span className={labelClass}>QR Image</span>
              <div className="mt-2">
                <PackageMediaField label="QR Image" folder="payment-methods" value={editing.qrImageUrl} onUploaded={(qrImageUrl) => updateEditing({ qrImageUrl })} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR><TH>Bank</TH><TH>Reference Number</TH><TH>QR Image</TH><TH /></TR>
            </THead>
            <TBody>
              {loading && <TR><TD colSpan={4}>Loading payment methods...</TD></TR>}
              {!loading && !paymentMethods.length && <TR><TD colSpan={4}>No payment methods yet.</TD></TR>}
              {!loading && paymentMethods.map((paymentMethod) => (
                <TR key={paymentMethod.id}>
                  <TD>{paymentMethod.bank}</TD>
                  <TD>{paymentMethod.referenceNumber}</TD>
                  <TD>
                    <div className="h-14 w-14 overflow-hidden rounded-[8px] border border-viaje-line bg-viaje-paper">
                      {paymentMethod.qrImageUrl ? (
                        <img src={paymentMethod.qrImageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-viaje-paperAlt" />
                      )}
                    </div>
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setEditing(paymentMethod)}>
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
    </div>
  );
}
