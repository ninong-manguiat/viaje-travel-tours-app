"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { PackageMediaField } from "@/components/admin/package-media-field";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { Airline, AirlineStatus } from "@/lib/airlines";

const fieldClass = "grid gap-1.5";
const labelClass = "text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft";

type AirlineFormErrors = Partial<Record<"name", string>>;
type AirlineFormTouched = Partial<Record<"name", boolean>>;

const emptyAirline: Airline = {
  id: "",
  name: "",
  logoUrl: "",
  status: "ACTIVE",
  nameKey: "",
};

export function AirlineManagementModal({ onClose }: { onClose: () => void }) {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [editing, setEditing] = useState<Airline | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [modalError, setModalError] = useState("");
  const [touched, setTouched] = useState<AirlineFormTouched>({});
  const [submitted, setSubmitted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/airlines")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load airlines")))
      .then((data) => setAirlines(Array.isArray(data.airlines) ? data.airlines : []))
      .catch(() => setStatus("Unable to load airlines."))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  function startCreate() {
    setStatus("");
    setModalError("");
    setTouched({});
    setSubmitted(false);
    setEditing({ ...emptyAirline });
  }

  function startEdit(airline: Airline) {
    setStatus("");
    setModalError("");
    setTouched({});
    setSubmitted(false);
    setEditing(airline);
  }

  function closeForm() {
    setEditing(null);
    setModalError("");
    setTouched({});
    setSubmitted(false);
  }

  function validateAirlineForm(airline: Airline | null) {
    const errors: AirlineFormErrors = {};
    if (!airline) return errors;
    if (!airline.name.trim()) errors.name = "Airline name is required.";
    const duplicate = airlines.some((item) => item.id !== airline.id && item.name.trim().toLowerCase() === airline.name.trim().toLowerCase());
    if (duplicate) errors.name = "An airline with this name already exists.";
    return errors;
  }

  const errors = useMemo(() => validateAirlineForm(editing), [airlines, editing]);
  const invalid = Object.values(errors).some(Boolean);

  function updateEditing(value: Partial<Airline>) {
    setEditing((current) => current ? { ...current, ...value } : current);
  }

  async function saveAirline() {
    if (!editing) return;

    setSubmitted(true);
    if (invalid) return;

    setSaving(true);
    setModalError("");
    const isNew = !editing.id;
    const response = await fetch(isNew ? "/api/admin/airlines" : `/api/admin/airlines/${editing.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ airline: editing }),
    });
    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setModalError(data?.error ?? "Unable to save airline.");
      return;
    }

    setRefreshKey((current) => current + 1);
    closeForm();
    setStatus(isNew ? "Airline added successfully." : "Airline saved.");
  }

  async function toggleAirline(airline: Airline) {
    const nextStatus: AirlineStatus = airline.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const response = await fetch(`/api/admin/airlines/${airline.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ airline: { ...airline, status: nextStatus } }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setStatus(data?.error ?? "Unable to update airline.");
      return;
    }

    setRefreshKey((current) => current + 1);
    setStatus(nextStatus === "ACTIVE" ? "Airline activated." : "Airline deactivated.");
  }

  async function removeAirline(airline: Airline) {
    if (!window.confirm(`Delete ${airline.name}?`)) return;

    const response = await fetch(`/api/admin/airlines/${airline.id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setStatus(data?.error ?? "Unable to delete airline.");
      return;
    }

    setRefreshKey((current) => current + 1);
    setStatus("Airline deleted.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-viaje-navy/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[8px] bg-white shadow-[0_28px_80px_-30px_rgba(0,0,0,0.65)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-viaje-line bg-white px-5 py-4">
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-viaje-red">Packages</p>
            <h2 className="font-serif text-2xl font-semibold text-viaje-navy">Manage Airlines</h2>
          </div>
          <Button type="button" variant="outline" size="icon" onClick={onClose} aria-label="Close airline management modal"><X className="h-4 w-4" /></Button>
        </div>
        <div className="grid gap-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-viaje-soft">Active airlines appear in the Package Editor dropdown. Deactivate airlines that should no longer be selected for new packages.</p>
            <Button type="button" onClick={startCreate}><Plus className="h-4 w-4" />Add Airline</Button>
          </div>
          {status && <p className="rounded-[8px] border border-viaje-line bg-viaje-paper p-3 text-sm text-viaje-soft">{status}</p>}
          <Card>
            <CardHeader><CardTitle>Airlines</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR><TH>Logo</TH><TH>Airline Name</TH><TH>Status</TH><TH /></TR>
                </THead>
                <TBody>
                  {loading && <TR><TD colSpan={4}>Loading airlines...</TD></TR>}
                  {!loading && !airlines.length && <TR><TD colSpan={4}>No airlines yet.</TD></TR>}
                  {!loading && airlines.map((airline) => (
                    <TR key={airline.id}>
                      <TD>
                        {airline.logoUrl ? (
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[8px] border border-viaje-line bg-viaje-paper p-1.5">
                            <img src={airline.logoUrl} alt="" className="max-h-full w-full object-contain" />
                          </div>
                        ) : (
                          <span className="text-xs text-viaje-soft">None</span>
                        )}
                      </TD>
                      <TD>{airline.name}</TD>
                      <TD><StatusBadge status={airline.status.toLowerCase()} /></TD>
                      <TD>
                        <div className="flex justify-end gap-2 whitespace-nowrap">
                          <Button type="button" size="sm" variant="outline" onClick={() => startEdit(airline)}>
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => toggleAirline(airline)}>
                            {airline.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          </Button>
                          <Button type="button" size="sm" variant="ghost" className="text-viaje-red" onClick={() => removeAirline(airline)} aria-label={`Delete ${airline.name}`}>
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
            <Card>
              <CardHeader><CardTitle>{editing.id ? "Edit Airline" : "Add Airline"}</CardTitle></CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-[1fr_180px]">
                <div className="grid gap-4">
                  <label className={fieldClass}>
                    <span className={labelClass}>Airline Name *</span>
                    <Input
                      required
                      value={editing.name}
                      onBlur={() => setTouched((current) => ({ ...current, name: true }))}
                      onChange={(event) => updateEditing({ name: event.target.value })}
                    />
                    {(submitted || touched.name) && errors.name && <span className="text-xs font-medium text-viaje-red">{errors.name}</span>}
                  </label>
                  <label className={fieldClass}>
                    <span className={labelClass}>Status</span>
                    <select
                      value={editing.status}
                      onChange={(event) => updateEditing({ status: event.target.value as AirlineStatus })}
                      className="h-11 rounded-[10px] border border-viaje-line bg-viaje-paper px-3.5 text-sm text-viaje-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </label>
                </div>
                <div>
                  <span className={labelClass}>Airline Logo</span>
                  <p className="mt-1 text-xs text-viaje-soft">Optional</p>
                  <div className="mt-2">
                    <PackageMediaField label="Airline Logo" folder="airlines/logos" value={editing.logoUrl} onUploaded={(logoUrl) => updateEditing({ logoUrl })} />
                  </div>
                </div>
                {modalError && <p className="rounded-[8px] border border-viaje-line bg-viaje-paper p-3 text-sm font-medium text-viaje-red md:col-span-2">{modalError}</p>}
                <div className="flex justify-end gap-3 md:col-span-2">
                  <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                  <Button type="button" onClick={saveAirline} disabled={saving || invalid}>{saving ? "Saving..." : "Save Airline"}</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
