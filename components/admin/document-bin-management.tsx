"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, Eye, FileText, Plus, Trash2, X } from "lucide-react";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  acceptedFileTypeOptions,
  documentBinProgress,
  documentName,
  documentTypeOptions,
  type AcceptedFileType,
  type DocumentBin,
  type DocumentRequirement,
  type DocumentType,
  type UploadMode,
} from "@/lib/document-bins";
import { formatDate } from "@/lib/utils";

type RequirementDraft = {
  id: string;
  documentType: DocumentType;
  customName: string;
  uploadMode: UploadMode;
  acceptedFileTypes: AcceptedFileType[];
};

type LinkedBookingContext = {
  id: string;
  reference: string;
};

const emptyRequirement = (): RequirementDraft => ({
  id: `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  documentType: "Passport",
  customName: "",
  uploadMode: "SINGLE",
  acceptedFileTypes: ["PDF", "JPG / JPEG", "PNG"],
});

const emptyForm = {
  clientName: "",
  email: "",
  contactNumber: "",
  purpose: "",
};

function binLink(bin: DocumentBin) {
  if (typeof window === "undefined" || !bin.publicToken) return "";
  return `${window.location.origin}/documents/${bin.publicToken}`;
}

function progressLabel(bin: DocumentBin) {
  const progress = documentBinProgress(bin.requirements);
  return `${progress.submitted} of ${progress.total} submitted • ${progress.approved} approved`;
}

function progressPercent(bin: DocumentBin) {
  const progress = documentBinProgress(bin.requirements);
  if (!progress.total) return 0;
  return Math.round((progress.submitted / progress.total) * 100);
}

function ProgressIndicator({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-viaje-paperAlt">
      <div className="h-full rounded-full bg-viaje-red transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function DocumentBinProgressIndicator({ value }: { value: number }) {
  return <ProgressIndicator value={value} />;
}

function bookingLink(bookingId: string) {
  return `/admin/bookings?bookingId=${encodeURIComponent(bookingId)}`;
}

function linkedBookingLabel(bin: DocumentBin) {
  return bin.bookingReference || bin.bookingId || "";
}

function LinkedBookingLink({ bookingId, label }: { bookingId?: string; label?: string }) {
  if (!bookingId) return <span className="text-viaje-soft">&mdash;</span>;

  return (
    <a href={bookingLink(bookingId)} className="font-semibold text-viaje-red hover:underline">
      {label || bookingId}
    </a>
  );
}

function openUploadedFiles(requirement: DocumentRequirement) {
  requirement.uploads.forEach((upload) => {
    if (upload.fileUrl) window.open(upload.fileUrl, "_blank", "noopener,noreferrer");
  });
}

function RequirementEditor({
  requirements,
  onChange,
  existingRequirements = [],
}: {
  requirements: RequirementDraft[];
  onChange: (requirements: RequirementDraft[]) => void;
  existingRequirements?: DocumentRequirement[];
}) {
  function updateRequirement(id: string, value: Partial<RequirementDraft>) {
    onChange(requirements.map((item) => item.id === id ? { ...item, ...value } : item));
  }

  function toggleAcceptedFileType(id: string, type: AcceptedFileType, checked: boolean) {
    const item = requirements.find((requirement) => requirement.id === id);
    if (!item) return;
    const acceptedFileTypes = checked
      ? Array.from(new Set([...item.acceptedFileTypes, type]))
      : item.acceptedFileTypes.filter((value) => value !== type);
    updateRequirement(id, { acceptedFileTypes });
  }

  return (
    <div className="grid gap-3">
      {requirements.map((requirement, index) => {
        const duplicate = requirement.documentType !== "Other" && [
          ...existingRequirements.map((item) => item.documentType),
          ...requirements.filter((item) => item.id !== requirement.id).map((item) => item.documentType),
        ].includes(requirement.documentType);
        return (
          <div key={requirement.id} className="grid gap-3 rounded-[8px] border border-viaje-line bg-viaje-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-viaje-navy">Document Requirement {index + 1}</strong>
              <Button type="button" size="sm" variant="ghost" className="text-viaje-red" onClick={() => onChange(requirements.filter((item) => item.id !== requirement.id))}>
                <X className="h-3.5 w-3.5" />Remove
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft">Document Type</span>
                <select
                  value={requirement.documentType}
                  onChange={(event) => updateRequirement(requirement.id, { documentType: event.target.value as DocumentType, customName: "" })}
                  className="h-11 rounded-[10px] border border-viaje-line bg-white px-3.5 text-sm text-viaje-ink"
                >
                  {documentTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft">Upload Quantity</span>
                <select
                  value={requirement.uploadMode}
                  onChange={(event) => updateRequirement(requirement.id, { uploadMode: event.target.value as UploadMode })}
                  className="h-11 rounded-[10px] border border-viaje-line bg-white px-3.5 text-sm text-viaje-ink"
                >
                  <option value="SINGLE">Single File</option>
                  <option value="MULTIPLE">Multiple Files</option>
                </select>
              </label>
              {requirement.documentType === "Other" && (
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft">Custom Document Name</span>
                  <Input value={requirement.customName} onChange={(event) => updateRequirement(requirement.id, { customName: event.target.value })} />
                </label>
              )}
            </div>
            <div className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft">Accepted File Types</span>
              <div className="flex flex-wrap gap-2">
                {acceptedFileTypeOptions.map((type) => (
                  <label key={type} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${requirement.acceptedFileTypes.includes(type) ? "border-viaje-red bg-viaje-red/10 text-viaje-red" : "border-viaje-line bg-white text-viaje-soft hover:bg-viaje-paperAlt"}`}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-viaje-line accent-viaje-red"
                      checked={requirement.acceptedFileTypes.includes(type)}
                      onChange={(event) => toggleAcceptedFileType(requirement.id, type, event.target.checked)}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
            {duplicate && <p className="text-sm text-viaje-red">Duplicate predefined requirements are not allowed.</p>}
          </div>
        );
      })}
      <Button type="button" variant="outline" className="w-fit" onClick={() => onChange([...requirements, emptyRequirement()])}>
        <Plus className="h-4 w-4" />Add Requirement
      </Button>
    </div>
  );
}

export function DocumentBinManagement() {
  const [bins, setBins] = useState<DocumentBin[]>([]);
  const [selected, setSelected] = useState<DocumentBin | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [linkedBooking, setLinkedBooking] = useState<LinkedBookingContext | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [requirements, setRequirements] = useState<RequirementDraft[]>([emptyRequirement()]);
  const [newRequirements, setNewRequirements] = useState<RequirementDraft[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/admin/document-bins")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load document bins")))
      .then((data) => setBins(data.documentBins))
      .catch(() => setStatus("Unable to load document bins."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(window.location.search);
    const documentBinId = params.get("documentBinId") || "";
    if (!documentBinId) return;

    const existing = bins.find((bin) => bin.id === documentBinId);
    if (existing) {
      setSelected(existing);
      return;
    }

    fetch(`/api/admin/document-bins/${encodeURIComponent(documentBinId)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load document bin")))
      .then((data) => setSelected(data.documentBin))
      .catch(() => setStatus("Unable to load linked document bin."));
  }, [bins, loading]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldCreate = params.get("createDocumentBin") === "1";
    const bookingId = params.get("bookingId") || "";
    if (!shouldCreate || !bookingId) return;

    setShowCreate(true);
    fetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load linked booking")))
      .then((data) => {
        const booking = data.booking ?? {};
        setLinkedBooking({ id: booking.id, reference: booking.reference || booking.id });
        setForm({
          clientName: [booking.groupContact?.firstName, booking.groupContact?.lastName].filter(Boolean).join(" ") || "",
          email: booking.groupContact?.emailAddress || "",
          contactNumber: booking.groupContact?.mobileNumber || "",
          purpose: "Tour Package",
        });
      })
      .catch(() => setStatus("Unable to load linked booking details."));
  }, []);

  const visibleBins = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return bins;
    return bins.filter((bin) => [bin.referenceNumber, bin.clientName].join(" ").toLowerCase().includes(normalized));
  }, [bins, query]);

  function resetCreate() {
    setForm(emptyForm);
    setRequirements([emptyRequirement()]);
    setLinkedBooking(null);
    setShowCreate(false);
  }

  function validateForm(items: RequirementDraft[]) {
    if (!form.clientName.trim() || !form.email.trim() || !form.contactNumber.trim() || !form.purpose.trim()) return "Client name, email, contact number, and purpose are required.";
    if (!items.length) return "At least one document requirement is required.";
    const seen = new Set<DocumentType>();
    for (const item of items) {
      if (item.documentType !== "Other") {
        if (seen.has(item.documentType)) return "Duplicate predefined requirements are not allowed.";
        seen.add(item.documentType);
      }
      if (item.documentType === "Other" && !item.customName.trim()) return "Custom document name is required.";
      if (!item.acceptedFileTypes.length) return "Accepted file types are required.";
    }
    return "";
  }

  async function createBin() {
    const error = validateForm(requirements);
    if (error) {
      setStatus(error);
      return;
    }

    setSaving(true);
    const response = await fetch("/api/admin/document-bins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, requirements, bookingId: linkedBooking?.id || "" }),
    });
    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setStatus(data?.error ?? "Unable to create document bin.");
      return;
    }

    const data = await response.json();
    setBins((current) => [data.documentBin, ...current]);
    setSelected(data.documentBin);
    resetCreate();
    setStatus("Document bin created.");
  }

  async function updateSelected(action: string, body: Record<string, unknown> = {}) {
    if (!selected) return;
    const response = await fetch(`/api/admin/document-bins/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setStatus(data?.error ?? "Unable to update document bin.");
      return;
    }

    const data = await response.json();
    setSelected(data.documentBin);
    setBins((current) => current.map((bin) => bin.id === data.documentBin.id ? data.documentBin : bin));
  }

  async function copyLink(bin: DocumentBin) {
    await navigator.clipboard.writeText(binLink(bin));
    setStatus("Document bin link copied.");
  }

  function openLink(bin: DocumentBin) {
    const url = binLink(bin);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function addRequirement() {
    if (!selected || !newRequirements[0]) return;
    const item = newRequirements[0];
    await updateSelected("addRequirement", { requirement: item });
    setNewRequirements([]);
  }

  async function cancelSelected() {
    if (!selected) return;
    if (!window.confirm(`Cancel ${selected.referenceNumber}? Uploaded files will be removed and the public link will stop working.`)) return;
    await updateSelected("cancelBin");
  }

  async function deleteBin(bin: DocumentBin) {
    if (bin.status !== "CANCELLED") return;
    if (!window.confirm(`Permanently delete ${bin.referenceNumber}? This action cannot be undone.`)) return;

    const response = await fetch(`/api/admin/document-bins/${bin.id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setStatus(data?.error ?? "Unable to delete document bin.");
      return;
    }

    setBins((current) => current.filter((item) => item.id !== bin.id));
    if (selected?.id === bin.id) setSelected(null);
    setStatus("Document bin deleted.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-viaje-red">Admin</p>
          <h1 className="mt-2 text-3xl font-bold text-viaje-navy">Documents</h1>
        </div>
        <Button type="button" onClick={() => { setLinkedBooking(null); setShowCreate(true); }}><Plus className="h-4 w-4" />Create Document Bin</Button>
      </div>

      {status && <p className="rounded-[8px] border border-viaje-line bg-white p-3 text-sm text-viaje-soft">{status}</p>}

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle>Manage Documents</CardTitle>
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reference or client" className="md:max-w-xs" />
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR><TH>Reference</TH><TH>Client Name</TH><TH>Linked Booking ID</TH><TH>Created At</TH><TH>Progress</TH><TH>Status</TH><TH>Actions</TH></TR>
            </THead>
            <TBody>
              {loading && <TR><TD colSpan={7}>Loading document bins...</TD></TR>}
              {!loading && !visibleBins.length && <TR><TD colSpan={7}>No document bins yet.</TD></TR>}
              {!loading && visibleBins.map((bin) => (
                <TR key={bin.id}>
                  <TD>{bin.referenceNumber}</TD>
                  <TD>{bin.clientName}</TD>
                  <TD><LinkedBookingLink bookingId={bin.bookingId} label={linkedBookingLabel(bin)} /></TD>
                  <TD>{bin.createdAt ? formatDate(bin.createdAt) : "N/A"}</TD>
                  <TD>
                    <div className="grid min-w-[150px] gap-2">
                      <ProgressIndicator value={progressPercent(bin)} />
                      <span className="text-xs text-viaje-soft">{progressLabel(bin)}</span>
                    </div>
                  </TD>
                  <TD><StatusBadge status={bin.status} /></TD>
                  <TD>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setSelected(bin)}><Eye className="h-3.5 w-3.5" />View</Button>
                      {bin.status === "CANCELLED" ? (
                        <Button type="button" size="sm" variant="outline" className="text-viaje-red" onClick={() => deleteBin(bin)}><Trash2 className="h-3.5 w-3.5" />Delete</Button>
                      ) : (
                        <>
                          <Button type="button" size="sm" variant="outline" onClick={() => copyLink(bin)}><Copy className="h-3.5 w-3.5" />Copy Link</Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => openLink(bin)}><ExternalLink className="h-3.5 w-3.5" />Open Link</Button>
                        </>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-viaje-navy/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[8px] bg-white shadow-[0_28px_80px_-30px_rgba(0,0,0,0.65)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-viaje-line bg-white px-5 py-4">
              <h2 className="font-serif text-2xl font-semibold text-viaje-navy">Create Document Bin</h2>
              <Button type="button" variant="outline" size="icon" onClick={resetCreate} aria-label="Close create document bin"><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid gap-6 p-5">
              <Card>
                <CardHeader><CardTitle>Client Information</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {linkedBooking && (
                    <div className="grid gap-1.5 md:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft">Linked Booking ID</span>
                      <a href={bookingLink(linkedBooking.id)} className="w-fit font-semibold text-viaje-red hover:underline">
                        {linkedBooking.reference}
                      </a>
                    </div>
                  )}
                  <label className="grid gap-1.5"><span className="text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft">Client Name</span><Input value={form.clientName} onChange={(event) => setForm((current) => ({ ...current, clientName: event.target.value }))} /></label>
                  <label className="grid gap-1.5"><span className="text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft">Email</span><Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label>
                  <label className="grid gap-1.5"><span className="text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft">Contact Number</span><Input value={form.contactNumber} onChange={(event) => setForm((current) => ({ ...current, contactNumber: event.target.value }))} /></label>
                  <label className="grid gap-1.5"><span className="text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft">Purpose</span><Input value={form.purpose} onChange={(event) => setForm((current) => ({ ...current, purpose: event.target.value }))} placeholder="Japan Visa Requirements" /></label>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Document Requirements</CardTitle></CardHeader>
                <CardContent><RequirementEditor requirements={requirements} onChange={setRequirements} /></CardContent>
              </Card>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={resetCreate}>Cancel</Button>
                <Button type="button" onClick={createBin} disabled={saving}>{saving ? "Creating..." : "Create Document Bin"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-viaje-navy/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full max-w-[min(1120px,calc(100vw-2rem))] overflow-y-auto rounded-[8px] bg-white shadow-[0_28px_80px_-30px_rgba(0,0,0,0.65)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-viaje-line bg-white px-5 py-4">
              <div>
                <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-viaje-red">{selected.referenceNumber}</p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-viaje-navy">Document Bin Details</h2>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => setSelected(null)} aria-label="Close document bin details"><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid min-w-0 gap-5 p-5">
              <Card>
                <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
                  <CardTitle>Summary</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {selected.status !== "CANCELLED" && (
                      <>
                        <Button type="button" size="sm" variant="outline" onClick={() => copyLink(selected)}><Copy className="h-3.5 w-3.5" />Copy Bin Link</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => openLink(selected)}><ExternalLink className="h-3.5 w-3.5" />Open Bin Link</Button>
                      </>
                    )}
                    {selected.status === "CANCELLED" ? (
                      <Button type="button" size="sm" variant="outline" className="text-viaje-red" onClick={() => deleteBin(selected)}><Trash2 className="h-3.5 w-3.5" />Delete</Button>
                    ) : (
                      <Button type="button" size="sm" variant="outline" className="text-viaje-red" onClick={() => cancelSelected()}>Cancel Bin</Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="grid min-w-0 gap-3 text-sm md:grid-cols-3">
                  <p className="min-w-0"><span className="text-viaje-soft">Reference</span><br /><strong>{selected.referenceNumber}</strong></p>
                  <p className="min-w-0"><span className="text-viaje-soft">Client Name</span><br /><strong className="break-words">{selected.clientName}</strong></p>
                  <p className="min-w-0"><span className="text-viaje-soft">Email</span><br /><strong className="break-words">{selected.email}</strong></p>
                  <p className="min-w-0"><span className="text-viaje-soft">Contact Number</span><br /><strong>{selected.contactNumber}</strong></p>
                  <p className="min-w-0"><span className="text-viaje-soft">Purpose</span><br /><strong className="break-words">{selected.purpose || "N/A"}</strong></p>
                  <p className="min-w-0"><span className="text-viaje-soft">Linked Booking ID</span><br /><LinkedBookingLink bookingId={selected.bookingId} label={linkedBookingLabel(selected)} /></p>
                  <p className="min-w-0"><span className="text-viaje-soft">Created Date</span><br /><strong>{selected.createdAt ? formatDate(selected.createdAt) : "N/A"}</strong></p>
                  <p className="min-w-0"><span className="text-viaje-soft">Bin Status</span><br /><StatusBadge status={selected.status} /></p>
                  <p className="min-w-0"><span className="text-viaje-soft">Submission Progress</span><br /><strong>{progressLabel(selected)}</strong></p>
                  {selected.cancelledAt && <p className="min-w-0"><span className="text-viaje-soft">Cancelled Date</span><br /><strong>{formatDate(selected.cancelledAt)}</strong></p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
                <CardContent className="min-w-0">
                  <Table className="table-fixed">
                    <THead><TR><TH className="w-[22%]">Document</TH><TH className="w-[14%]">Upload Quantity</TH><TH className="w-[14%]">Status</TH><TH className="w-[14%]">Uploaded Files</TH><TH className="w-[14%]">Uploaded Date</TH><TH className="w-[22%]">Actions</TH></TR></THead>
                    <TBody>
                      {selected.requirements.map((requirement) => {
                        const latestUpload = requirement.uploads[requirement.uploads.length - 1];
                        return (
                          <TR key={requirement.id}>
                            <TD><span className="block min-w-0 break-words">{documentName(requirement)}</span></TD>
                            <TD>{requirement.uploadMode === "MULTIPLE" ? "Multiple Files" : "Single File"}</TD>
                            <TD><StatusBadge status={requirement.status} /></TD>
                            <TD>
                              {requirement.uploads.length ? (
                                <Button type="button" size="sm" variant="outline" className="w-fit" onClick={() => openUploadedFiles(requirement)}>
                                  <FileText className="h-3.5 w-3.5" />{requirement.uploads.length > 1 ? "View Files" : "View File"}
                                </Button>
                              ) : <span className="text-viaje-soft">Not yet uploaded</span>}
                            </TD>
                            <TD>{latestUpload?.uploadedAt ? formatDate(latestUpload.uploadedAt) : "N/A"}</TD>
                            <TD>
                              {requirement.status === "SUBMITTED" ? (
                                <div className="flex flex-wrap gap-2">
                                  <Button type="button" size="sm" onClick={() => updateSelected("reviewRequirement", { requirementId: requirement.id, status: "APPROVED" })}>Approve</Button>
                                  <Button type="button" size="sm" variant="outline" className="text-viaje-red" onClick={() => updateSelected("reviewRequirement", { requirementId: requirement.id, status: "REJECTED" })}>Reject</Button>
                                </div>
                              ) : <span className="text-xs text-viaje-soft">No action</span>}
                            </TD>
                          </TR>
                        );
                      })}
                    </TBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Manage Requirements</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {!newRequirements.length ? (
                    <Button type="button" variant="outline" onClick={() => setNewRequirements([emptyRequirement()])}><Plus className="h-4 w-4" />Add Requirement</Button>
                  ) : (
                    <>
                      <RequirementEditor requirements={newRequirements} onChange={(items) => setNewRequirements(items.slice(0, 1))} existingRequirements={selected.requirements} />
                      <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setNewRequirements([])}>Cancel</Button>
                        <Button type="button" onClick={addRequirement}>Save Requirement</Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
