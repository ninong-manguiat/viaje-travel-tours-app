"use client";

import { useRef, useState } from "react";
import { Trash2, UploadCloud } from "lucide-react";

const labelClass = "text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft";

export function PackageMediaField({
  label,
  value,
  folder,
  onUploaded,
  uploadUrl = "/api/admin/website-content/upload",
}: {
  label: string;
  value: string;
  folder: string;
  onUploaded: (value: string) => void;
  uploadUrl?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const response = await fetch(uploadUrl, { method: "POST", body: formData });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      onUploaded(data.url);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="relative" aria-label={label}>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
      {value ? (
        <div className="group relative aspect-square overflow-hidden rounded-[10px] border border-viaje-line bg-viaje-paper">
          <img src={value} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center gap-2 rounded-[10px] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              disabled={uploading}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-white text-viaje-soft">
                <UploadCloud className="h-4 w-4" />
              </span>
              {uploading ? "Uploading..." : "Change photo"}
            </button>
            <button
              type="button"
              onClick={() => onUploaded("")}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-viaje-red transition hover:bg-white"
              aria-label={`Remove ${label}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-viaje-line bg-viaje-paper text-sm font-semibold text-viaje-soft transition hover:bg-viaje-paperAlt"
          disabled={uploading}
        >
          <UploadCloud className="h-5 w-5" />
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
      )}
    </div>
  );
}

export function PackageGalleryMediaField({ label, values, folder, onChange, maxPhotos = 4 }: { label: string; values: string[]; folder: string; onChange: (values: string[]) => void; maxPhotos?: number }) {
  const [uploading, setUploading] = useState(false);
  const [warning, setWarning] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const canUpload = values.length < maxPhotos;

  async function upload(fileList?: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;

    const remainingSlots = maxPhotos - values.length;
    if (remainingSlots <= 0) {
      setWarning(`Maximum of ${maxPhotos} photos only.`);
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    setWarning(files.length > remainingSlots ? `Only ${remainingSlots} more photo${remainingSlots === 1 ? "" : "s"} can be uploaded. Maximum is ${maxPhotos}.` : "");
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);
        const response = await fetch("/api/admin/website-content/upload", { method: "POST", body: formData });
        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();
        uploadedUrls.push(data.url);
      }
      onChange([...values, ...uploadedUrls]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <span className={labelClass}>{label}</span>
        <span className={`text-xs font-medium ${values.length >= maxPhotos ? "text-viaje-red" : "text-viaje-soft"}`}>
          {warning || `${values.length}/${maxPhotos} photos uploaded. Maximum of ${maxPhotos} photos only.`}
        </span>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => upload(event.target.files)} />
      <div className="rounded-[10px] border border-viaje-line p-4">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {values.map((value, index) => (
            <div key={`${value}-${index}`} className="grid gap-2">
              <div className="aspect-square overflow-hidden rounded-[10px] border border-viaje-line bg-viaje-paper">
                <img src={value} alt="" className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => {
                  onChange(values.filter((_, itemIndex) => itemIndex !== index));
                  setWarning("");
                }}
                className="flex w-fit items-center gap-1.5 text-xs font-semibold text-viaje-red transition hover:text-viaje-red/80"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          ))}
          {canUpload && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-viaje-line bg-viaje-paper text-sm font-semibold text-viaje-soft transition hover:bg-viaje-paperAlt"
              disabled={uploading}
            >
              <UploadCloud className="h-5 w-5" />
              {uploading ? "Uploading..." : "Upload Image"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
