"use client";

import { useEffect, useRef, useState } from "react";
import type { DragEvent, ReactNode } from "react";
import {
  Anchor,
  BadgeCheck,
  Building,
  Building2,
  Bus,
  CalendarCheck,
  Car,
  Check,
  ChevronDown,
  Facebook,
  FileCheck,
  FileText,
  Globe2,
  GripVertical,
  Hotel,
  IdCard,
  ImageIcon,
  Landmark,
  MapPin,
  MapPinned,
  Phone,
  Plane,
  Plus,
  ReceiptText,
  Route,
  Save,
  ShieldCheck,
  Ship,
  Sparkles,
  Trash2,
  UploadCloud,
  Map,
  PlaneTakeoff,
  ShipWheel,
  BusFront,
  Contact,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cmsIconOptions, defaultWebsiteContent, type CmsAccreditation, type CmsActivity, type CmsClient, type CmsIconName, type CmsProofTransaction, type CmsService, type CmsServiceListItem, type WebsiteContent } from "@/lib/website-content";

const fieldClass = "grid gap-1.5";
const labelClass = "text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft";
const textareaClass = "min-h-24 rounded-[10px] border border-viaje-line bg-viaje-paper px-3.5 py-3 text-sm text-viaje-ink outline-none focus-visible:ring-2 focus-visible:ring-ring";

const iconMap: Record<CmsIconName, LucideIcon> = {
  Anchor,
  BadgeCheck,
  Building,
  Building2,
  Bus,
  CalendarCheck,
  Car,
  Check,
  ChevronDown,
  Facebook,
  FileCheck,
  FileText,
  Globe2,
  Hotel,
  IdCard,
  ImageIcon,
  Landmark,
  MapPin,
  MapPinned,
  Phone,
  Plane,
  Plus,
  ReceiptText,
  Route,
  Save,
  ShieldCheck,
  Ship,
  Sparkles,
  Trash2,
  UploadCloud,
  Map,
  PlaneTakeoff,
  ShipWheel,
  BusFront,
  Contact,
};

function newService(): CmsService {
  return { name: "New Service", icon: "Sparkles", list: [{ icon: "BadgeCheck", text: "Service item" }] };
}

function newActivity(): CmsActivity {
  return { coverPhotoUrl: "", date: "", place: "", title: "New Activity", description: "", galleryUrls: [] };
}

function newProof(): CmsProofTransaction {
  return { title: "New Proof", description: "", galleryUrls: [] };
}

export function IconSelect({ value, onChange }: { value: CmsIconName; onChange: (value: CmsIconName) => void }) {
  const [open, setOpen] = useState(false);
  const SelectedIcon = iconMap[value];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-[10px] border border-viaje-line bg-viaje-paper px-3.5 text-left text-sm font-medium text-viaje-ink outline-none transition hover:border-viaje-red focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          <SelectedIcon className="h-4 w-4 shrink-0 text-viaje-red" />
          <span className="truncate">{value}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-viaje-soft transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-auto rounded-[10px] border border-viaje-line bg-white p-1.5 shadow-[0_18px_40px_-24px_rgba(15,36,56,0.55)]">
          {cmsIconOptions.map((icon) => {
            const Icon = iconMap[icon];
            const selected = value === icon;
            return (
              <button
                key={icon}
                type="button"
                onClick={() => {
                  onChange(icon);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-left text-sm transition hover:bg-viaje-paperAlt ${
                  selected ? "bg-viaje-red/10 font-semibold text-viaje-red" : "text-viaje-ink"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{icon}</span>
                </span>
                {selected && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AccordionSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader className="p-0">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
          aria-expanded={open}
        >
          <CardTitle>{title}</CardTitle>
          <ChevronDown className={`h-5 w-5 text-viaje-soft transition ${open ? "rotate-180" : ""}`} />
        </button>
      </CardHeader>
      {open && <CardContent className="grid gap-5 border-t border-viaje-line pt-5">{children}</CardContent>}
    </Card>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className={fieldClass}>
      <span className={labelClass}>{label}</span>
      <Input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className={fieldClass}>
      <span className={labelClass}>{label}</span>
      <textarea className={textareaClass} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

async function deleteWebsiteContentImage(url: string) {
  if (!url) return;
  await fetch("/api/admin/website-content/upload", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  }).catch(() => undefined);
}

function SingleImageUpload({ label, value, folder, onChange }: { label: string; value: string; folder: string; onChange: (value: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function removeCurrent() {
    await deleteWebsiteContentImage(value);
    onChange("");
  }

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      if (value) {
        await deleteWebsiteContentImage(value);
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const response = await fetch("/api/admin/website-content/upload", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      onChange(data.url);
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
              onClick={removeCurrent}
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

function MultipleImageUpload({ label, values, folder, onChange, maxPhotos = 4 }: { label: string; values: string[]; folder: string; onChange: (values: string[]) => void; maxPhotos?: number }) {
  const [uploading, setUploading] = useState(false);
  const [warning, setWarning] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const canUpload = values.length < maxPhotos;

  async function removePhoto(index: number) {
    const url = values[index];
    await deleteWebsiteContentImage(url);
    onChange(values.filter((_, itemIndex) => itemIndex !== index));
    setWarning("");
  }

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
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => upload(event.target.files)}
      />
      <div className="rounded-[10px] border border-viaje-line p-4">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {values.map((value, index) => (
            <div key={`${value}-${index}`} className="grid gap-2">
              <div className="aspect-square overflow-hidden rounded-[10px] border border-viaje-line bg-viaje-paper">
                <img src={value} alt="" className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => removePhoto(index)}
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

function ServiceItemAccordion({
  service,
  index,
  onChange,
  onRemove,
}: {
  service: CmsService;
  index: number;
  onChange: (service: CmsService) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const title = `Service # ${index + 1} : ${service.name || "Untitled Service"}`;

  return (
    <div className="overflow-visible rounded-[10px] border border-viaje-line bg-white">
      <div className="flex items-center gap-2 px-5 py-4">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left"
          aria-expanded={open}
        >
          <span className="min-w-0 truncate font-serif text-xl font-semibold text-viaje-navy">{title}</span>
          <ChevronDown className={`h-5 w-5 text-viaje-soft transition ${open ? "rotate-180" : ""}`} />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setConfirmingRemove((current) => !current)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-viaje-red transition hover:bg-viaje-red/10"
            aria-label={`Remove ${service.name || title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {confirmingRemove && (
            <div className="absolute right-0 top-11 z-40 w-56 rounded-[10px] border border-viaje-line bg-white p-3 text-sm shadow-[0_18px_40px_-24px_rgba(15,36,56,0.55)]">
              <p className="font-semibold text-viaje-navy">Remove this service?</p>
              <div className="mt-3 flex justify-end gap-2">
                <Button type="button" size="sm" variant="ghost" className="w-fit" onClick={() => setConfirmingRemove(false)}>
                  Cancel
                </Button>
                <Button type="button" size="sm" variant="destructive" className="w-fit" onClick={onRemove}>
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="grid gap-5 border-t border-viaje-line p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Name of the Service"
              value={service.name}
              onChange={(value) => onChange({ ...service, name: value })}
            />
            <label className={fieldClass}>
              <span className={labelClass}>Icon of the Service</span>
              <IconSelect value={service.icon} onChange={(value) => onChange({ ...service, icon: value })} />
            </label>
          </div>

          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className={labelClass}>List of the Service</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-fit"
                onClick={() => onChange({ ...service, list: [...service.list, { icon: "BadgeCheck", text: "" }] })}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </Button>
            </div>

            {service.list.map((item: CmsServiceListItem, itemIndex) => (
              <div key={itemIndex} className="grid gap-3 md:grid-cols-[minmax(180px,260px)_minmax(0,1fr)_auto] md:items-center">
                <IconSelect
                  value={item.icon}
                  onChange={(value) => {
                    const list = [...service.list];
                    list[itemIndex] = { ...item, icon: value };
                    onChange({ ...service, list });
                  }}
                />
                <Input
                  value={item.text}
                  onChange={(event) => {
                    const list = [...service.list];
                    list[itemIndex] = { ...item, text: event.target.value };
                    onChange({ ...service, list });
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-fit text-viaje-red"
                  onClick={() => onChange({ ...service, list: service.list.filter((_, listIndex) => listIndex !== itemIndex) })}
                  aria-label={`Remove service item ${itemIndex + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CmsItemAccordion({
  title,
  removeLabel,
  children,
  onRemove,
  dragLabel,
  isDragging = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  title: string;
  removeLabel: string;
  children: ReactNode;
  onRemove: () => void;
  dragLabel?: string;
  isDragging?: boolean;
  onDragStart?: (event: DragEvent<HTMLButtonElement>) => void;
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  return (
    <div
      className={`overflow-visible rounded-[10px] border border-viaje-line bg-white transition ${isDragging ? "opacity-50" : ""}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-2 px-5 py-4">
        {onDragStart && (
          <button
            type="button"
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-full text-viaje-soft transition hover:bg-viaje-paperAlt active:cursor-grabbing"
            aria-label={dragLabel || `Reorder ${title}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left"
          aria-expanded={open}
        >
          <span className="min-w-0 truncate font-serif text-xl font-semibold text-viaje-navy">{title}</span>
          <ChevronDown className={`h-5 w-5 text-viaje-soft transition ${open ? "rotate-180" : ""}`} />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setConfirmingRemove((current) => !current)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-viaje-red transition hover:bg-viaje-red/10"
            aria-label={removeLabel}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {confirmingRemove && (
            <div className="absolute right-0 top-11 z-40 w-56 rounded-[10px] border border-viaje-line bg-white p-3 text-sm shadow-[0_18px_40px_-24px_rgba(15,36,56,0.55)]">
              <p className="font-semibold text-viaje-navy">{removeLabel}?</p>
              <div className="mt-3 flex justify-end gap-2">
                <Button type="button" size="sm" variant="ghost" className="w-fit" onClick={() => setConfirmingRemove(false)}>
                  Cancel
                </Button>
                <Button type="button" size="sm" variant="destructive" className="w-fit" onClick={onRemove}>
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {open && <div className="grid gap-5 border-t border-viaje-line p-5">{children}</div>}
    </div>
  );
}

type SortableCmsSection = "accreditations" | "clients" | "activities" | "proofs";

function reorderItems<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

export function WebsiteContentEditor() {
  const [content, setContent] = useState<WebsiteContent>(defaultWebsiteContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [draggedItem, setDraggedItem] = useState<{ section: SortableCmsSection; index: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/website-content")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load content")))
      .then((data) => {
        if (mounted) setContent(data.content);
      })
      .catch(() => setStatus("Unable to load Firestore content. Showing defaults."))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  async function save() {
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/website-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      if (!response.ok) throw new Error("Save failed");
      setStatus("Website content saved to Firestore.");
    } catch {
      setStatus("Unable to save website content.");
    } finally {
      setSaving(false);
    }
  }

  function section<K extends keyof WebsiteContent>(key: K, value: WebsiteContent[K]) {
    setContent((current) => ({ ...current, [key]: value }));
  }

  function startItemDrag(sectionName: SortableCmsSection, index: number, event: DragEvent<HTMLButtonElement>) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `${sectionName}:${index}`);
    setDraggedItem({ section: sectionName, index });
  }

  function allowItemDrop(sectionName: SortableCmsSection, event: DragEvent<HTMLDivElement>) {
    if (draggedItem?.section !== sectionName) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function dropItem(sectionName: SortableCmsSection, toIndex: number, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!draggedItem || draggedItem.section !== sectionName || draggedItem.index === toIndex) {
      setDraggedItem(null);
      return;
    }

    if (sectionName === "accreditations") {
      section("accreditation", {
        ...content.accreditation,
        accreditations: reorderItems(content.accreditation.accreditations, draggedItem.index, toIndex),
      });
    }

    if (sectionName === "clients") {
      section("clients", {
        ...content.clients,
        clients: reorderItems(content.clients.clients, draggedItem.index, toIndex),
      });
    }

    if (sectionName === "activities") {
      section("recentActivities", {
        ...content.recentActivities,
        activities: reorderItems(content.recentActivities.activities, draggedItem.index, toIndex),
      });
    }

    if (sectionName === "proofs") {
      section("proofTransactions", {
        ...content.proofTransactions,
        proofs: reorderItems(content.proofTransactions.proofs, draggedItem.index, toIndex),
      });
    }

    setDraggedItem(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-viaje-red">CMS</p>
          <h1 className="mt-2 text-3xl font-bold text-viaje-navy">Website Content</h1>
        </div>
        <Button className="w-fit" onClick={save} disabled={saving || loading}><Save className="h-4 w-4" />{saving ? "Saving..." : "Save Content"}</Button>
      </div>

      {status && <p className="rounded-[8px] border border-viaje-line bg-white p-3 text-sm text-viaje-soft">{status}</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px] xl:items-start">
        <div className="space-y-6">
      <AccordionSection title="Services Section" defaultOpen>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Section Description" value={content.services.sectionDescription} onChange={(value) => section("services", { ...content.services, sectionDescription: value })} />
            <TextField label="Section Description Subs" value={content.services.sectionDescriptionSubs} onChange={(value) => section("services", { ...content.services, sectionDescriptionSubs: value })} />
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="outline" className="w-fit" onClick={() => section("services", { ...content.services, services: [...content.services.services, newService()] })}>
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          </div>
          <div className="grid gap-4">
            {content.services.services.map((service, index) => (
              <ServiceItemAccordion
                key={index}
                service={service}
                index={index}
                onChange={(nextService) => {
                  const services = [...content.services.services];
                  services[index] = nextService;
                  section("services", { ...content.services, services });
                }}
                onRemove={() => section("services", { ...content.services, services: content.services.services.filter((_, itemIndex) => itemIndex !== index) })}
              />
            ))}
          </div>
      </AccordionSection>

      <AccordionSection title="About Us Section">
        <div className="grid gap-4 md:grid-cols-2">
        <div className="max-w-md md:col-span-2">
          <SingleImageUpload
            label="Photo of the Office"
            folder="about-us"
            value={content.aboutUs.officePhotoUrl}
            onChange={(value) => section("aboutUs", { ...content.aboutUs, officePhotoUrl: value })}
          />
        </div>
          <TextField label="Section Description" value={content.aboutUs.sectionDescription} onChange={(value) => section("aboutUs", { ...content.aboutUs, sectionDescription: value })} />
          <TextField label="Section Description Subs" value={content.aboutUs.sectionDescriptionSubs} onChange={(value) => section("aboutUs", { ...content.aboutUs, sectionDescriptionSubs: value })} />
          <TextField label="Contact Number" value={content.aboutUs.contactNumber} onChange={(value) => section("aboutUs", { ...content.aboutUs, contactNumber: value })} />
          <TextField label="Landline Number" value={content.aboutUs.landlineNumber} onChange={(value) => section("aboutUs", { ...content.aboutUs, landlineNumber: value })} />
          <TextField label="Facebook" value={content.aboutUs.facebook} onChange={(value) => section("aboutUs", { ...content.aboutUs, facebook: value })} />
          <TextField label="Link of Direction" value={content.aboutUs.directionLink} onChange={(value) => section("aboutUs", { ...content.aboutUs, directionLink: value })} />
          <div className="md:col-span-2"><TextAreaField label="Direction" value={content.aboutUs.direction} onChange={(value) => section("aboutUs", { ...content.aboutUs, direction: value })} /></div>
        </div>
      </AccordionSection>

      <RepeatableSimpleSection
        title="Accreditation Section"
        description={content.accreditation.sectionDescription}
        subtitle={content.accreditation.sectionDescriptionSubs}
        onDescription={(value) => section("accreditation", { ...content.accreditation, sectionDescription: value })}
        onSubtitle={(value) => section("accreditation", { ...content.accreditation, sectionDescriptionSubs: value })}
      >
        <div className="flex justify-end">
          <Button type="button" variant="outline" className="w-fit" onClick={() => section("accreditation", { ...content.accreditation, accreditations: [...content.accreditation.accreditations, { imageUrl: "", name: "", subtitle: "" }] })}>
            <Plus className="h-4 w-4" />
            Add Accreditation
          </Button>
        </div>
        <div className="grid gap-4">
          {content.accreditation.accreditations.map((item: CmsAccreditation, index) => (
            <CmsItemAccordion
              key={index}
              title={`Accreditation # ${index + 1} : ${item.name || "Untitled Accreditation"}`}
              removeLabel="Remove this accreditation"
              dragLabel={`Reorder ${item.name || `accreditation ${index + 1}`}`}
              isDragging={draggedItem?.section === "accreditations" && draggedItem.index === index}
              onDragStart={(event) => startItemDrag("accreditations", index, event)}
              onDragOver={(event) => allowItemDrop("accreditations", event)}
              onDrop={(event) => dropItem("accreditations", index, event)}
              onDragEnd={() => setDraggedItem(null)}
              onRemove={() =>
                section("accreditation", {
                  ...content.accreditation,
                  accreditations: content.accreditation.accreditations.filter((_, itemIndex) => itemIndex !== index),
                })
              }
            >
              <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_260px] md:items-start">
                <div className="space-y-6">
                  <TextField
                    label="Name"
                    value={item.name}
                    onChange={(value) => {
                      const accreditations = [...content.accreditation.accreditations];
                      accreditations[index] = { ...item, name: value };
                      section("accreditation", { ...content.accreditation, accreditations });
                    }}
                  />
                  <TextField
                    label="Subtitle"
                    value={item.subtitle}
                    onChange={(value) => {
                      const accreditations = [...content.accreditation.accreditations];
                      accreditations[index] = { ...item, subtitle: value };
                      section("accreditation", { ...content.accreditation, accreditations });
                    }}
                  />
                </div>
                <SingleImageUpload
                  label="Accreditation Image"
                  folder="accreditations"
                  value={item.imageUrl}
                  onChange={(value) => {
                    const accreditations = [...content.accreditation.accreditations];
                    accreditations[index] = { ...item, imageUrl: value };
                    section("accreditation", { ...content.accreditation, accreditations });
                  }}
                />
              </div>
            </CmsItemAccordion>
          ))}
        </div>
      </RepeatableSimpleSection>

      <RepeatableSimpleSection
        title="Client Section"
        description={content.clients.sectionDescription}
        subtitle={content.clients.sectionDescriptionSubs}
        onDescription={(value) => section("clients", { ...content.clients, sectionDescription: value })}
        onSubtitle={(value) => section("clients", { ...content.clients, sectionDescriptionSubs: value })}
      >
        <div className="flex justify-end">
          <Button type="button" variant="outline" className="w-fit" onClick={() => section("clients", { ...content.clients, clients: [...content.clients.clients, { logoUrl: "", title: "", subtitle: "" }] })}>
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </div>
        <div className="grid gap-4">
          {content.clients.clients.map((client: CmsClient, index) => (
            <CmsItemAccordion
              key={index}
              title={`Client # ${index + 1} : ${client.title || "Untitled Client"}`}
              removeLabel="Remove this client"
              dragLabel={`Reorder ${client.title || `client ${index + 1}`}`}
              isDragging={draggedItem?.section === "clients" && draggedItem.index === index}
              onDragStart={(event) => startItemDrag("clients", index, event)}
              onDragOver={(event) => allowItemDrop("clients", event)}
              onDrop={(event) => dropItem("clients", index, event)}
              onDragEnd={() => setDraggedItem(null)}
              onRemove={() =>
                section("clients", {
                  ...content.clients,
                  clients: content.clients.clients.filter((_, itemIndex) => itemIndex !== index),
                })
              }
            >
              <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_260px] md:items-start">
                <div className="space-y-6">
                  <TextField
                    label="Title"
                    value={client.title}
                    onChange={(value) => {
                      const clients = [...content.clients.clients];
                      clients[index] = { ...client, title: value };
                      section("clients", { ...content.clients, clients });
                    }}
                  />
                  <TextField
                    label="Subtitle"
                    value={client.subtitle}
                    onChange={(value) => {
                      const clients = [...content.clients.clients];
                      clients[index] = { ...client, subtitle: value };
                      section("clients", { ...content.clients, clients });
                    }}
                  />
                </div>
                <SingleImageUpload
                  label="Logo"
                  folder="clients"
                  value={client.logoUrl}
                  onChange={(value) => {
                    const clients = [...content.clients.clients];
                    clients[index] = { ...client, logoUrl: value };
                    section("clients", { ...content.clients, clients });
                  }}
                />
              </div>
            </CmsItemAccordion>
          ))}
        </div>
      </RepeatableSimpleSection>

      <RepeatableSimpleSection
        title="Recent Activity Section"
        description={content.recentActivities.sectionDescription}
        subtitle={content.recentActivities.sectionDescriptionSubs}
        onDescription={(value) => section("recentActivities", { ...content.recentActivities, sectionDescription: value })}
        onSubtitle={(value) => section("recentActivities", { ...content.recentActivities, sectionDescriptionSubs: value })}
      >
        <div className="flex justify-end">
          <Button type="button" variant="outline" className="w-fit" onClick={() => section("recentActivities", { ...content.recentActivities, activities: [...content.recentActivities.activities, newActivity()] })}>
            <Plus className="h-4 w-4" />
            Add Activity
          </Button>
        </div>
        <div className="grid gap-4">
          {content.recentActivities.activities.map((activity: CmsActivity, index) => (
            <CmsItemAccordion
              key={index}
              title={activity.title || "Untitled Activity"}
              removeLabel="Remove this activity"
              dragLabel={`Reorder ${activity.title || `activity ${index + 1}`}`}
              isDragging={draggedItem?.section === "activities" && draggedItem.index === index}
              onDragStart={(event) => startItemDrag("activities", index, event)}
              onDragOver={(event) => allowItemDrop("activities", event)}
              onDrop={(event) => dropItem("activities", index, event)}
              onDragEnd={() => setDraggedItem(null)}
              onRemove={() => section("recentActivities", { ...content.recentActivities, activities: content.recentActivities.activities.filter((_, itemIndex) => itemIndex !== index) })}
            >
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
                <div className="grid gap-4">
                  <TextField
                    label="Date of Activity"
                    value={activity.date}
                    onChange={(value) => {
                      const activities = [...content.recentActivities.activities];
                      activities[index] = { ...activity, date: value };
                      section("recentActivities", { ...content.recentActivities, activities });
                    }}
                  />
                  <TextField
                    label="Place"
                    value={activity.place}
                    onChange={(value) => {
                      const activities = [...content.recentActivities.activities];
                      activities[index] = { ...activity, place: value };
                      section("recentActivities", { ...content.recentActivities, activities });
                    }}
                  />
                  <TextField
                    label="Activity Title"
                    value={activity.title}
                    onChange={(value) => {
                      const activities = [...content.recentActivities.activities];
                      activities[index] = { ...activity, title: value };
                      section("recentActivities", { ...content.recentActivities, activities });
                    }}
                  />
                </div>
                <SingleImageUpload
                  label="Cover Photo"
                  folder="activities"
                  value={activity.coverPhotoUrl}
                  onChange={(value) => {
                    const activities = [...content.recentActivities.activities];
                    activities[index] = { ...activity, coverPhotoUrl: value };
                    section("recentActivities", { ...content.recentActivities, activities });
                  }}
                />
              </div>
              <TextAreaField
                label="Activity Description"
                value={activity.description}
                onChange={(value) => {
                  const activities = [...content.recentActivities.activities];
                  activities[index] = { ...activity, description: value };
                  section("recentActivities", { ...content.recentActivities, activities });
                }}
              />
              <MultipleImageUpload
                label="Gallery"
                folder="activities/gallery"
                values={activity.galleryUrls}
                onChange={(galleryUrls) => {
                  const activities = [...content.recentActivities.activities];
                  activities[index] = { ...activity, galleryUrls };
                  section("recentActivities", { ...content.recentActivities, activities });
                }}
              />
            </CmsItemAccordion>
          ))}
        </div>
      </RepeatableSimpleSection>

      <RepeatableSimpleSection
        title="Proof of Transaction Section"
        description={content.proofTransactions.sectionDescription}
        subtitle={content.proofTransactions.sectionDescriptionSubs}
        onDescription={(value) => section("proofTransactions", { ...content.proofTransactions, sectionDescription: value })}
        onSubtitle={(value) => section("proofTransactions", { ...content.proofTransactions, sectionDescriptionSubs: value })}
      >
        <div className="flex justify-end">
          <Button type="button" variant="outline" className="w-fit" onClick={() => section("proofTransactions", { ...content.proofTransactions, proofs: [...content.proofTransactions.proofs, newProof()] })}>
            <Plus className="h-4 w-4" />
            Add Proof of Transaction
          </Button>
        </div>
        <div className="grid gap-4">
          {content.proofTransactions.proofs.map((proof: CmsProofTransaction, index) => (
            <CmsItemAccordion
              key={index}
              title={`Proof # ${index + 1} : ${proof.title || "Untitled Proof"}`}
              removeLabel="Remove this proof"
              dragLabel={`Reorder ${proof.title || `proof ${index + 1}`}`}
              isDragging={draggedItem?.section === "proofs" && draggedItem.index === index}
              onDragStart={(event) => startItemDrag("proofs", index, event)}
              onDragOver={(event) => allowItemDrop("proofs", event)}
              onDrop={(event) => dropItem("proofs", index, event)}
              onDragEnd={() => setDraggedItem(null)}
              onRemove={() => section("proofTransactions", { ...content.proofTransactions, proofs: content.proofTransactions.proofs.filter((_, itemIndex) => itemIndex !== index) })}
            >
              <TextField label="Proof of Transaction Title" value={proof.title} onChange={(value) => {
                const proofs = [...content.proofTransactions.proofs];
                proofs[index] = { ...proof, title: value };
                section("proofTransactions", { ...content.proofTransactions, proofs });
              }} />
              <TextAreaField label="Proof of Transaction Description" value={proof.description} onChange={(value) => {
                const proofs = [...content.proofTransactions.proofs];
                proofs[index] = { ...proof, description: value };
                section("proofTransactions", { ...content.proofTransactions, proofs });
              }} />
              <MultipleImageUpload
                label="Gallery"
                folder="proof-transactions"
                values={proof.galleryUrls}
                onChange={(galleryUrls) => {
                  const proofs = [...content.proofTransactions.proofs];
                  proofs[index] = { ...proof, galleryUrls };
                  section("proofTransactions", { ...content.proofTransactions, proofs });
                }}
              />
            </CmsItemAccordion>
          ))}
        </div>
      </RepeatableSimpleSection>
        </div>
        <WebsiteContentPreview content={content} />
      </div>
    </div>
  );
}

function PreviewImage({ src, label }: { src?: string; label: string }) {
  return src ? (
    <img src={src} alt={label} className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-viaje-paperAlt text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-viaje-soft">
      <div>
        <ImageIcon className="mx-auto mb-2 h-5 w-5 text-viaje-red" />
        {label}
      </div>
    </div>
  );
}

function WebsiteContentPreview({ content }: { content: WebsiteContent }) {
  return (
    <aside className="sticky top-6 hidden max-h-[calc(100vh-48px)] overflow-hidden rounded-[16px] border border-viaje-line bg-white shadow-[0_22px_60px_-42px_rgba(15,36,56,0.48)] xl:block">
      <div className="flex items-center justify-between border-b border-viaje-line px-4 py-3">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-viaje-red">Live Preview</p>
          <h2 className="mt-1 font-serif text-lg font-semibold text-viaje-navy">Homepage</h2>
        </div>
        <span className="rounded-full bg-viaje-paper px-2.5 py-1 text-[10px] font-semibold text-viaje-soft">Realtime</span>
      </div>
      <div className="h-[calc(100vh-134px)] overflow-y-auto bg-white">
        <section className="bg-[linear-gradient(333deg,#faf9f5_0%,#89000012_48%,#ffffff_100%)] px-5 py-8 text-center">
          <img src="/brand/viaje-logo.png" alt="Viaje Travel and Tours" className="mx-auto w-28" />
          <h3 className="mx-auto mt-5 max-w-[280px] font-serif text-3xl font-medium leading-tight text-viaje-navy">
            We make the plan, <em className="text-viaje-red">you pack your bags.</em>
          </h3>
          <div className="mt-5 flex justify-center gap-2">
            <span className="rounded-full bg-viaje-red px-4 py-2 text-xs font-semibold text-white">Explore</span>
            <span className="rounded-full border border-viaje-navy2 px-4 py-2 text-xs font-semibold text-viaje-navy2">Call</span>
          </div>
        </section>

        <PreviewSection eyebrow={content.services.sectionDescription} title={content.services.sectionDescriptionSubs}>
          <div className="grid gap-3">
            {content.services.services.map((service, index) => {
              const Icon = iconMap[service.icon];
              return (
                <div key={`${service.name}-${index}`} className="rounded-[10px] border border-viaje-line p-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-viaje-red" />
                    <h4 className="font-serif text-base font-semibold text-viaje-navy">{service.name}</h4>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs leading-5 text-viaje-soft">
                    {service.list.slice(0, 4).map((item, itemIndex) => {
                      const ItemIcon = iconMap[item.icon];
                      return (
                        <li key={`${item.text}-${itemIndex}`} className="flex items-start gap-2">
                          <ItemIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-viaje-red" />
                          <span>{item.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </PreviewSection>

        <PreviewSection eyebrow={content.aboutUs.sectionDescription} title={content.aboutUs.sectionDescriptionSubs}>
          <div className="aspect-[4/3] overflow-hidden rounded-[10px] border border-viaje-line">
            <PreviewImage src={content.aboutUs.officePhotoUrl} label="Office photo" />
          </div>
          <div className="mt-3 space-y-2 text-xs leading-5 text-viaje-soft">
            <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-viaje-red" />{content.aboutUs.contactNumber}</p>
            <p className="flex items-center gap-2"><Facebook className="h-3.5 w-3.5 text-viaje-red" />{content.aboutUs.facebook || "Facebook page"}</p>
            <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-viaje-red" />{content.aboutUs.direction}</p>
          </div>
        </PreviewSection>

        <PreviewSection eyebrow={content.accreditation.sectionDescription} title={content.accreditation.sectionDescriptionSubs}>
          <div className="space-y-2">
            {content.accreditation.accreditations.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex items-center gap-3 rounded-[10px] border border-viaje-line p-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[8px] bg-viaje-paper">
                    <PreviewImage src={item.imageUrl} label="Badge" />
                  </div>
                  <div>
                    <p className="font-serif text-sm font-semibold text-viaje-navy">{item.name}</p>
                    <p className="text-[11px] text-viaje-soft">{item.subtitle}</p>
                  </div>
                </div>
            ))}
          </div>
        </PreviewSection>

        <PreviewSection eyebrow={content.clients.sectionDescription} title={content.clients.sectionDescriptionSubs}>
          <div className="grid gap-2">
            {content.clients.clients.slice(0, 4).map((client, index) => (
              <div key={`${client.title}-${index}`} className="flex items-center gap-3 rounded-[10px] border border-viaje-line p-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[8px] text-white">
                  {client.logoUrl ? <img src={client.logoUrl} alt={client.title} className="h-full w-full object-cover" /> : <Building2 className="m-2.5 h-5 w-5" />}
                </div>
                <div>
                  <p className="font-serif text-sm font-semibold text-viaje-navy">{client.title}</p>
                  <p className="text-[11px] text-viaje-soft">{client.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </PreviewSection>

        <PreviewSection eyebrow={content.recentActivities.sectionDescription} title={content.recentActivities.sectionDescriptionSubs}>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {content.recentActivities.activities.map((activity, index) => (
              <article key={`${activity.title}-${index}`} className="min-w-[210px] overflow-hidden rounded-[10px] border border-viaje-line">
                <div className="h-28">
                  <PreviewImage src={activity.coverPhotoUrl} label="Cover" />
                </div>
                <div className="p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-viaje-soft">{activity.date} / {activity.place}</p>
                  <h4 className="mt-2 font-serif text-base font-semibold leading-tight text-viaje-navy">{activity.title}</h4>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-viaje-soft">{activity.description}</p>
                </div>
              </article>
            ))}
          </div>
        </PreviewSection>

        <PreviewSection eyebrow={content.proofTransactions.sectionDescription} title={content.proofTransactions.sectionDescriptionSubs}>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {content.proofTransactions.proofs.map((proof, index) => (
              <article key={`${proof.title}-${index}`} className="min-w-[210px] overflow-hidden rounded-[10px] border border-viaje-line">
                <div className="h-28">
                  <PreviewImage src={proof.galleryUrls[0]} label="Proof" />
                </div>
                <div className="p-3">
                  <h4 className="font-serif text-base font-semibold leading-tight text-viaje-navy">{proof.title}</h4>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-viaje-soft">{proof.description}</p>
                </div>
              </article>
            ))}
          </div>
        </PreviewSection>
      </div>
    </aside>
  );
}

function PreviewSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-viaje-line px-5 py-6">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-viaje-red">{eyebrow}</p>
      <h3 className="mt-2 font-serif text-xl font-semibold leading-tight text-viaje-navy">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function RepeatableSimpleSection({
  title,
  description,
  subtitle,
  onDescription,
  onSubtitle,
  children
}: {
  title: string;
  description: string;
  subtitle: string;
  onDescription: (value: string) => void;
  onSubtitle: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <AccordionSection title={title}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Section Description" value={description} onChange={onDescription} />
          <TextField label="Section Description Subs" value={subtitle} onChange={onSubtitle} />
        </div>
        {children}
    </AccordionSection>
  );
}
