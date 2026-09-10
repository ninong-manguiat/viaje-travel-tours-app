"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptAttribute, documentName, type DocumentBin, type DocumentRequirement } from "@/lib/document-bins";

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

  async function upload(requirement: DocumentRequirement, fileList?: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;

    setUploadingId(requirement.id);
    setError("");
    const formData = new FormData();
    formData.append("requirementId", requirement.id);
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
    const input = inputs.current[requirement.id];
    if (input) input.value = "";
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
              const latestUpload = requirement.uploads[requirement.uploads.length - 1];
              const canUpload = !isCancelled && requirement.status !== "APPROVED";
              return (
                <div key={requirement.id} className="grid gap-3 rounded-[8px] border border-viaje-line bg-viaje-paper p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-serif text-xl font-semibold text-viaje-navy">{documentName(requirement)}</h2>
                      <StatusBadge status={requirement.status === "REJECTED" ? "REUPLOAD REQUIRED" : requirement.status} />
                    </div>
                    <p className="mt-1 text-sm text-viaje-soft">Accepted: {requirement.acceptedFileTypes.join(", ")}</p>
                    <p className="text-sm text-viaje-soft">{requirement.uploadMode === "MULTIPLE" ? "Multiple files allowed" : "Single file required"}</p>
                    {latestUpload && (
                      <div className="mt-2 flex flex-wrap gap-3 text-sm">
                        <span className="text-viaje-soft">{latestUpload.originalFilename}</span>
                        <a href={latestUpload.fileUrl} target="_blank" className="font-semibold text-viaje-red">View File</a>
                      </div>
                    )}
                  </div>
                  {canUpload && (
                    <div>
                      <input
                        ref={(element) => { inputs.current[requirement.id] = element; }}
                        type="file"
                        accept={acceptAttribute(requirement.acceptedFileTypes)}
                        multiple={requirement.uploadMode === "MULTIPLE"}
                        className="hidden"
                        onChange={(event) => upload(requirement, event.target.files)}
                      />
                      <Button type="button" variant="outline" onClick={() => inputs.current[requirement.id]?.click()} disabled={uploadingId === requirement.id}>
                        <UploadCloud className="h-4 w-4" /> {actionLabel(requirement, uploadingId === requirement.id)}
                      </Button>
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
