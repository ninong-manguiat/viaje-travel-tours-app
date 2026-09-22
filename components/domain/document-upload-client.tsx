"use client";

import { useRef, useState } from "react";
import { FileText, Trash2, UploadCloud } from "lucide-react";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptAttribute, documentName, maxDocumentUploadsPerRequirement, type DocumentBin, type DocumentRequirement } from "@/lib/document-bins";

function actionLabel(requirement: DocumentRequirement, uploading: boolean) {
  if (uploading) return "Uploading...";
  if (requirement.status === "REJECTED") return "Replace File";
  return requirement.uploads.length ? "Replace File" : "Upload File";
}

export function DocumentUploadClient({ documentBin }: { documentBin: DocumentBin }) {
  const [bin, setBin] = useState(documentBin);
  const [uploadingId, setUploadingId] = useState("");
  const [error, setError] = useState("");
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const isCancelled = bin.status === "CANCELLED";

  function inputKey(requirementId: string, action = "add", uploadId = "") {
    return [requirementId, action, uploadId].filter(Boolean).join(":");
  }

  async function uploadFiles(requirement: DocumentRequirement, fileList?: FileList | null, action: "add" | "replace" = "add", uploadId = "") {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;

    if (requirement.uploadMode === "MULTIPLE" && action === "add" && requirement.uploads.length + files.length > maxDocumentUploadsPerRequirement) {
      setError(`A maximum of ${maxDocumentUploadsPerRequirement} files is allowed for ${documentName(requirement)}.`);
      return;
    }

    const currentUploadingId = inputKey(requirement.id, action, uploadId);
    setUploadingId(currentUploadingId);
    setError("");
    const formData = new FormData();
    formData.append("requirementId", requirement.id);
    formData.append("action", action);
    if (uploadId) formData.append("uploadId", uploadId);
    files.forEach((file) => formData.append("files", file));
    const response = await fetch(`/api/documents/${bin.publicToken}/upload`, { method: "POST", body: formData });
    setUploadingId("");

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error ?? "Upload failed.");
      return;
    }

    const data = await response.json();
    setBin(data.documentBin);
    const input = inputs.current[currentUploadingId];
    if (input) input.value = "";
  }

  async function deleteUpload(requirement: DocumentRequirement, uploadId: string) {
    if (!window.confirm("Delete this uploaded file?")) return;

    const currentUploadingId = inputKey(requirement.id, "delete", uploadId);
    setUploadingId(currentUploadingId);
    setError("");
    const formData = new FormData();
    formData.append("requirementId", requirement.id);
    formData.append("action", "delete");
    formData.append("uploadId", uploadId);
    const response = await fetch(`/api/documents/${bin.publicToken}/upload`, { method: "POST", body: formData });
    setUploadingId("");

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error ?? "Unable to delete file.");
      return;
    }

    const data = await response.json();
    setBin(data.documentBin);
  }

  return (
    <main>
      <section className="relative overflow-hidden bg-gradient-to-br from-viaje-navy via-viaje-navy2 to-viaje-navy3 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_8%,rgba(216,154,61,0.20),transparent_38%)]" />
        <div className="container-page relative py-12">
          <p className="eyebrow text-viaje-gold">Viaje Travel and Tours</p>
          <h1 className="mt-3 text-[clamp(2.55rem,5vw,4.8rem)] leading-[0.95]">Requested Documents</h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-7 text-white/76">
            Please upload the documents requested by Viaje Travel and Tours. You may return to this link anytime while your document request is active.
          </p>
        </div>
      </section>

      <section className="container-page max-w-4xl py-10">
        {error && <p className="mb-5 rounded-[8px] border border-viaje-line bg-white p-3 text-sm text-viaje-red">{error}</p>}
        {isCancelled && <p className="mb-5 rounded-[8px] border border-viaje-line bg-white p-3 text-sm text-viaje-soft">This document bin has been cancelled and no longer accepts uploads.</p>}

        <Card className="mb-6">
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <p><span className="text-viaje-soft">Name</span><br /><strong className="text-viaje-navy">{bin.clientName || "N/A"}</strong></p>
            <p><span className="text-viaje-soft">Email</span><br /><strong className="text-viaje-navy">{bin.email || "N/A"}</strong></p>
            <p><span className="text-viaje-soft">Reference</span><br /><strong className="text-viaje-navy">{bin.referenceNumber}</strong></p>
            <p><span className="text-viaje-soft">Purpose</span><br /><strong className="text-viaje-navy">{bin.purpose || "N/A"}</strong></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Document Requirements</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            {!bin.requirements.length && <p className="text-sm text-viaje-soft">No documents are currently requested.</p>}
            {bin.requirements.map((requirement) => {
              const canUpload = !isCancelled && requirement.status !== "APPROVED";
              const isMultiple = requirement.uploadMode === "MULTIPLE";
              const addKey = inputKey(requirement.id);
              const canAddMore = requirement.uploads.length < maxDocumentUploadsPerRequirement;
              return (
                <div key={requirement.id} className="grid gap-3 rounded-[8px] border border-viaje-line bg-viaje-paper p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-serif text-xl font-semibold text-viaje-navy">{documentName(requirement)}</h2>
                      <StatusBadge status={requirement.status === "REJECTED" ? "REUPLOAD REQUIRED" : requirement.status} />
                    </div>
                    <p className="mt-1 text-sm text-viaje-soft">Accepted: {requirement.acceptedFileTypes.join(", ")}</p>
                    <p className="text-sm text-viaje-soft">{isMultiple ? `Multiple files allowed, up to ${maxDocumentUploadsPerRequirement}` : "Single file required"}</p>
                    {requirement.uploads.length > 0 && (
                      <div className="mt-3 grid gap-2 text-sm">
                        {requirement.uploads.map((upload, uploadIndex) => (
                          <div key={upload.id} className="flex flex-wrap items-center gap-2 rounded-[8px] border border-viaje-line bg-white p-2">
                            <span className="min-w-0 flex-1 truncate font-semibold text-viaje-navy">
                              {upload.originalFilename || `File ${uploadIndex + 1}`}
                            </span>
                            <a href={upload.fileUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-center gap-2 rounded-full border-[1.5px] border-viaje-navy2 bg-transparent px-4 text-xs font-semibold text-viaje-navy2 transition hover:-translate-y-0.5 hover:bg-viaje-paperAlt">
                              <FileText className="h-3.5 w-3.5" />
                              View
                            </a>
                            {canUpload && isMultiple && (
                              <>
                                <input
                                  ref={(element) => { inputs.current[inputKey(requirement.id, "replace", upload.id)] = element; }}
                                  type="file"
                                  accept={acceptAttribute(requirement.acceptedFileTypes)}
                                  className="hidden"
                                  onChange={(event) => uploadFiles(requirement, event.target.files, "replace", upload.id)}
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => inputs.current[inputKey(requirement.id, "replace", upload.id)]?.click()}
                                  disabled={uploadingId === inputKey(requirement.id, "replace", upload.id)}
                                >
                                  <UploadCloud className="h-3.5 w-3.5" />
                                  {uploadingId === inputKey(requirement.id, "replace", upload.id) ? "Replacing..." : "Replace"}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="text-viaje-red"
                                  onClick={() => deleteUpload(requirement, upload.id)}
                                  disabled={uploadingId === inputKey(requirement.id, "delete", upload.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  {uploadingId === inputKey(requirement.id, "delete", upload.id) ? "Deleting..." : "Delete"}
                                </Button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {canUpload && isMultiple && !canAddMore && (
                      <p className="mt-3 rounded-[8px] border border-viaje-line bg-white p-2 text-sm font-medium text-viaje-red">
                        A maximum of {maxDocumentUploadsPerRequirement} files is allowed.
                      </p>
                    )}
                  </div>
                  {canUpload && (
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={(element) => { inputs.current[addKey] = element; }}
                        type="file"
                        accept={acceptAttribute(requirement.acceptedFileTypes)}
                        multiple={isMultiple}
                        className="hidden"
                        onChange={(event) => uploadFiles(requirement, event.target.files)}
                      />
                      {(!isMultiple || canAddMore) && (
                        <Button type="button" variant="outline" onClick={() => inputs.current[addKey]?.click()} disabled={uploadingId === addKey}>
                          <UploadCloud className="h-4 w-4" /> {isMultiple ? uploadingId === addKey ? "Adding..." : "Add File" : actionLabel(requirement, uploadingId === addKey)}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
