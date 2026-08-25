"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";

export function PackageMediaField({ label, value, folder, onUploaded }: { label: string; value: string; folder: string; onUploaded: (value: string) => void }) {
  const [uploading, setUploading] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const response = await fetch("/api/admin/website-content/upload", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      onUploaded(data.url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-2" aria-label={label}>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-viaje-line bg-viaje-paper px-3 text-center text-sm font-semibold text-viaje-soft transition hover:bg-viaje-paperAlt">
          <UploadCloud className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload Image"}
          <input type="file" accept="image/*" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
        </label>
        <div className="aspect-square overflow-hidden rounded-[10px] border border-viaje-line bg-viaje-paper">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs font-medium text-viaje-soft">
              Preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
