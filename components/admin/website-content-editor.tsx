"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
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
import { cmsIconOptions, defaultWebsiteContent, type CmsActivity, type CmsClient, type CmsIconName, type CmsProofTransaction, type CmsService, type CmsServiceListItem, type WebsiteContent } from "@/lib/website-content";

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

function IconSelect({ value, onChange }: { value: CmsIconName; onChange: (value: CmsIconName) => void }) {
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

function ImageUploadField({ label, value, folder, onUploaded }: { label: string; value: string; folder: string; onUploaded: (value: string) => void }) {
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

function GalleryEditor({ label, values, folder, onChange }: { label: string; values: string[]; folder: string; onChange: (values: string[]) => void }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className={labelClass}>{label}</span>
        <Button type="button" size="sm" variant="outline" className="w-fit" onClick={() => onChange([...values, ""])}><Plus className="h-3.5 w-3.5" />Add</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {values.map((value, index) => (
          <div key={index} className="rounded-[8px] border border-viaje-line p-3">
            <ImageUploadField
              label={`Image ${index + 1}`}
              value={value}
              folder={folder}
              onUploaded={(url) => onChange(values.map((item, itemIndex) => itemIndex === index ? url : item))}
            />
            <Button type="button" size="sm" variant="ghost" className="mt-2 w-fit text-viaje-red" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}>
              <Trash2 className="h-3.5 w-3.5" />Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WebsiteContentEditor() {
  const [content, setContent] = useState<WebsiteContent>(defaultWebsiteContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

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
          {content.services.services.map((service, index) => (
            <div key={index} className="rounded-[8px] border border-viaje-line p-4">
              <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
                <TextField label="Name of the Service" value={service.name} onChange={(value) => {
                  const services = [...content.services.services];
                  services[index] = { ...service, name: value };
                  section("services", { ...content.services, services });
                }} />
                <label className={fieldClass}><span className={labelClass}>Icon of the Service</span><IconSelect value={service.icon} onChange={(value) => {
                  const services = [...content.services.services];
                  services[index] = { ...service, icon: value };
                  section("services", { ...content.services, services });
                }} /></label>
                <Button type="button" variant="ghost" className="w-fit text-viaje-red" onClick={() => section("services", { ...content.services, services: content.services.services.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="h-4 w-4" />Remove</Button>
              </div>
              <div className="mt-4 grid gap-3">
                <div className="flex flex-wrap justify-between gap-3"><span className={labelClass}>List of the Service</span><Button type="button" size="sm" variant="outline" className="w-fit" onClick={() => {
                  const services = [...content.services.services];
                  services[index] = { ...service, list: [...service.list, { icon: "BadgeCheck", text: "" }] };
                  section("services", { ...content.services, services });
                }}><Plus className="h-3.5 w-3.5" />Add Item</Button></div>
                {service.list.map((item: CmsServiceListItem, itemIndex) => (
                  <div key={itemIndex} className="grid gap-3 md:grid-cols-[220px_1fr_auto] md:items-center">
                    <IconSelect value={item.icon} onChange={(value) => {
                      const services = [...content.services.services];
                      const list = [...service.list];
                      list[itemIndex] = { ...item, icon: value };
                      services[index] = { ...service, list };
                      section("services", { ...content.services, services });
                    }} />
                    <Input value={item.text} onChange={(event) => {
                      const services = [...content.services.services];
                      const list = [...service.list];
                      list[itemIndex] = { ...item, text: event.target.value };
                      services[index] = { ...service, list };
                      section("services", { ...content.services, services });
                    }} />
                    <Button type="button" size="sm" variant="ghost" className="w-fit text-viaje-red" onClick={() => {
                      const services = [...content.services.services];
                      services[index] = { ...service, list: service.list.filter((_, listIndex) => listIndex !== itemIndex) };
                      section("services", { ...content.services, services });
                    }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-fit" onClick={() => section("services", { ...content.services, services: [...content.services.services, newService()] })}><Plus className="h-4 w-4" />Add Service</Button>
      </AccordionSection>

      <AccordionSection title="About Us Section">
        <div className="grid gap-4 md:grid-cols-2">
        <div className="max-w-md md:col-span-2"><ImageUploadField label="Photo of the Office" folder="about-us" value={content.aboutUs.officePhotoUrl} onUploaded={(value) => section("aboutUs", { ...content.aboutUs, officePhotoUrl: value })} /></div>
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
        {content.accreditation.accreditations.map((item, index) => (
          <div
            key={index}
            className="grid gap-6 rounded-[8px] border border-viaje-line p-4 md:grid-cols-[12fr_7fr_1fr] md:items-end"
          >

            <div className="space-y-6">
              <TextField
                label="Name"
                value={item.name}
                onChange={(value) => {
                  const accreditations = [...content.accreditation.accreditations];
                  accreditations[index] = { ...item, name: value };
                  section("accreditation", {
                    ...content.accreditation,
                    accreditations,
                  });
                }}
              />

              <TextField
                label="Subtitle"
                value={item.subtitle}
                onChange={(value) => {
                  const accreditations = [...content.accreditation.accreditations];
                  accreditations[index] = { ...item, subtitle: value };
                  section("accreditation", {
                    ...content.accreditation,
                    accreditations,
                  });
                }}
              />
            </div>

            <ImageUploadField
              label="Accreditation Image"
              folder="accreditations"
              value={item.imageUrl}
              onUploaded={(value) => {
                const accreditations = [...content.accreditation.accreditations];
                accreditations[index] = { ...item, imageUrl: value };
                section("accreditation", {
                  ...content.accreditation,
                  accreditations,
                });
              }}
            />

            <Button
              type="button"
              variant="ghost"
              className="w-fit text-viaje-red"
              onClick={() =>
                section("accreditation", {
                  ...content.accreditation,
                  accreditations: content.accreditation.accreditations.filter(
                    (_, itemIndex) => itemIndex !== index
                  ),
                })
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" className="w-fit" onClick={() => section("accreditation", { ...content.accreditation, accreditations: [...content.accreditation.accreditations, { imageUrl: "", name: "", subtitle: "" }] })}><Plus className="h-4 w-4" />Add Accreditation</Button>
      </RepeatableSimpleSection>

      <RepeatableSimpleSection
        title="Client Section"
        description={content.clients.sectionDescription}
        subtitle={content.clients.sectionDescriptionSubs}
        onDescription={(value) => section("clients", { ...content.clients, sectionDescription: value })}
        onSubtitle={(value) => section("clients", { ...content.clients, sectionDescriptionSubs: value })}
      >
        {content.clients.clients.map((client: CmsClient, index) => (
        
        <div
          key={index}
          className="grid gap-6 rounded-[8px] border border-viaje-line p-4 md:grid-cols-[12fr_7fr_1fr] md:items-end"
        >
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
          <ImageUploadField
            label="Logo"
            folder="clients"
            value={client.logoUrl}
            onUploaded={(value) => {
              const clients = [...content.clients.clients];
              clients[index] = { ...client, logoUrl: value };
              section("clients", { ...content.clients, clients });
            }}
          />
          <Button
            type="button"
            variant="ghost"
            className="w-fit text-viaje-red"
            onClick={() =>
              section("clients", {
                ...content.clients,
                clients: content.clients.clients.filter(
                  (_, itemIndex) => itemIndex !== index
                ),
              })
            }
          >
          <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        ))}
        <Button type="button" variant="outline" className="w-fit" onClick={() => section("clients", { ...content.clients, clients: [...content.clients.clients, { logoUrl: "", title: "", subtitle: "" }] })}><Plus className="h-4 w-4" />Add Client</Button>
      </RepeatableSimpleSection>

      <RepeatableSimpleSection
        title="Recent Activity Section"
        description={content.recentActivities.sectionDescription}
        subtitle={content.recentActivities.sectionDescriptionSubs}
        onDescription={(value) => section("recentActivities", { ...content.recentActivities, sectionDescription: value })}
        onSubtitle={(value) => section("recentActivities", { ...content.recentActivities, sectionDescriptionSubs: value })}
      >
        {content.recentActivities.activities.map((activity: CmsActivity, index) => (
          <div key={index} className="grid gap-4 rounded-[8px] border border-viaje-line p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <ImageUploadField label="Cover Photo" folder="activities" value={activity.coverPhotoUrl} onUploaded={(value) => {
                const activities = [...content.recentActivities.activities];
                activities[index] = { ...activity, coverPhotoUrl: value };
                section("recentActivities", { ...content.recentActivities, activities });
              }} />
              <div className="grid gap-4">
                <TextField label="Date of Activity" value={activity.date} onChange={(value) => {
                  const activities = [...content.recentActivities.activities];
                  activities[index] = { ...activity, date: value };
                  section("recentActivities", { ...content.recentActivities, activities });
                }} />
                <TextField label="Place" value={activity.place} onChange={(value) => {
                  const activities = [...content.recentActivities.activities];
                  activities[index] = { ...activity, place: value };
                  section("recentActivities", { ...content.recentActivities, activities });
                }} />
                <TextField label="Activity Title" value={activity.title} onChange={(value) => {
                  const activities = [...content.recentActivities.activities];
                  activities[index] = { ...activity, title: value };
                  section("recentActivities", { ...content.recentActivities, activities });
                }} />
              </div>
            </div>
            <TextAreaField label="Activity Description" value={activity.description} onChange={(value) => {
              const activities = [...content.recentActivities.activities];
              activities[index] = { ...activity, description: value };
              section("recentActivities", { ...content.recentActivities, activities });
            }} />
            <GalleryEditor label="Gallery" folder="activities/gallery" values={activity.galleryUrls} onChange={(galleryUrls) => {
              const activities = [...content.recentActivities.activities];
              activities[index] = { ...activity, galleryUrls };
              section("recentActivities", { ...content.recentActivities, activities });
            }} />
            <Button type="button" variant="ghost" className="w-fit text-viaje-red" onClick={() => section("recentActivities", { ...content.recentActivities, activities: content.recentActivities.activities.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="h-4 w-4" />Remove Activity</Button>
          </div>
        ))}
        <Button type="button" variant="outline" className="w-fit" onClick={() => section("recentActivities", { ...content.recentActivities, activities: [...content.recentActivities.activities, newActivity()] })}><Plus className="h-4 w-4" />Add Activity</Button>
      </RepeatableSimpleSection>

      <RepeatableSimpleSection
        title="Proof of Transaction Section"
        description={content.proofTransactions.sectionDescription}
        subtitle={content.proofTransactions.sectionDescriptionSubs}
        onDescription={(value) => section("proofTransactions", { ...content.proofTransactions, sectionDescription: value })}
        onSubtitle={(value) => section("proofTransactions", { ...content.proofTransactions, sectionDescriptionSubs: value })}
      >
        {content.proofTransactions.proofs.map((proof: CmsProofTransaction, index) => (
          <div key={index} className="grid gap-4 rounded-[8px] border border-viaje-line p-4">
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
            <GalleryEditor label="Gallery" folder="proof-transactions" values={proof.galleryUrls} onChange={(galleryUrls) => {
              const proofs = [...content.proofTransactions.proofs];
              proofs[index] = { ...proof, galleryUrls };
              section("proofTransactions", { ...content.proofTransactions, proofs });
            }} />
            <Button type="button" variant="ghost" className="w-fit text-viaje-red" onClick={() => section("proofTransactions", { ...content.proofTransactions, proofs: content.proofTransactions.proofs.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="h-4 w-4" />Remove Proof</Button>
          </div>
        ))}
        <Button type="button" variant="outline" className="w-fit" onClick={() => section("proofTransactions", { ...content.proofTransactions, proofs: [...content.proofTransactions.proofs, newProof()] })}><Plus className="h-4 w-4" />Add Proof of Transaction</Button>
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
