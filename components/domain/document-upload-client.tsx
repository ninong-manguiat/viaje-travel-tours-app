"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BookingDocumentRequirement } from "@/lib/booking-documents";

export function DocumentUploadClient({
  token,
  requirements,
}: {
  token: string;
  requirements: BookingDocumentRequirement[];
}) {
  const [items, setItems] = useState(requirements);
  const [uploadingId, setUploadingId] = useState("");
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function upload(requirementId: string, file?: File) {
    if (!file) return;

    setUploadingId(requirementId);
    const formData = new FormData();
    formData.append("requirementId", requirementId);
    formData.append("file", file);
    const response = await fetch(`/api/documents/${token}/upload`, { method: "POST", body: formData });
    setUploadingId("");

    if (!response.ok) return;

    const data = await response.json();
    setItems(data.documentRequirements);
    if (inputs.current[requirementId]) inputs.current[requirementId].value = "";
  }

  return (
    <main className="container-page max-w-4xl py-10">
      <div className="mb-8">
        <p className="font-semibold text-viaje-red">Document Upload</p>
        <h1 className="text-3xl font-bold text-viaje-navy">Requested Documents</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Document Requirements</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          {!items.length && <p className="text-sm text-viaje-soft">No documents are currently requested.</p>}
          {items.map((item) => (
            <div key={item.id} className="grid gap-3 rounded-[8px] border border-viaje-line bg-viaje-paper p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-serif text-xl font-semibold text-viaje-navy">{item.type}</h2>
                  <StatusBadge status={item.status} />
                </div>
                {item.uploadedFileUrl && (
                  <a href={item.uploadedFileUrl} target="_blank" className="mt-2 inline-block text-sm font-semibold text-viaje-red">View uploaded file</a>
                )}
              </div>
              <div>
                <input
                  ref={(element) => { inputs.current[item.id] = element; }}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(event) => upload(item.id, event.target.files?.[0])}
                />
                <Button type="button" variant="outline" onClick={() => inputs.current[item.id]?.click()} disabled={uploadingId === item.id}>
                  <UploadCloud className="h-4 w-4" /> {uploadingId === item.id ? "Uploading..." : item.uploadedFileUrl ? "Replace File" : "Upload File"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
