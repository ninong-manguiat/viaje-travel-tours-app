"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { PackageMediaField } from "@/components/admin/package-media-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { newPackage, packageAvailabilityStatuses, packageStatuses, packageTypes } from "@/lib/package-content";
import type { TravelPackage } from "@/lib/types";

const labelClass = "text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft";
const fieldClass = "grid gap-1.5";
const inputClass = "h-11 rounded-[10px] border border-viaje-line bg-viaje-paper px-3.5 text-sm text-viaje-ink outline-none focus-visible:ring-2 focus-visible:ring-ring";
const textareaClass = "min-h-28 rounded-[10px] border border-viaje-line bg-viaje-paper px-3.5 py-3 text-sm text-viaje-ink outline-none focus-visible:ring-2 focus-visible:ring-ring";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "package";
}

function TextField({ label, value, onChange, type = "text" }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return (
    <label className={fieldClass}>
      <span className={labelClass}>{label}</span>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className={fieldClass}>
      <span className={labelClass}>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        {options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
      </select>
    </label>
  );
}

function StringListEditor({ label, values, onChange }: { label: string; values: string[]; onChange: (values: string[]) => void }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className={labelClass}>{label}</span>
        <Button type="button" size="sm" variant="outline" className="w-fit" onClick={() => onChange([...values, ""])}><Plus className="h-3.5 w-3.5" />Add</Button>
      </div>
      {values.map((value, index) => (
        <div key={index} className="grid gap-2 md:grid-cols-[1fr_auto]">
          <Input value={value} onChange={(event) => onChange(values.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} />
          <Button type="button" size="sm" variant="ghost" className="w-fit text-viaje-red" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ))}
    </div>
  );
}

export function PackageEditor({ packageId }: { packageId: string }) {
  const router = useRouter();
  const isNew = packageId === "new";
  const [pkg, setPkg] = useState<TravelPackage>(newPackage());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/packages/${packageId}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load package")))
      .then((data) => setPkg(data.package))
      .catch(() => setStatus("Unable to load package."))
      .finally(() => setLoading(false));
  }, [isNew, packageId]);

  function update(value: Partial<TravelPackage>) {
    setPkg((current) => ({ ...current, ...value }));
  }

  async function save() {
    setSaving(true);
    setStatus("");
    const payload = { package: { ...pkg, slug: pkg.slug || slugify(pkg.title) } };
    const response = await fetch(isNew ? "/api/admin/packages" : `/api/admin/packages/${pkg.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSaving(false);

    if (!response.ok) {
      setStatus("Unable to save package.");
      return;
    }

    const data = await response.json();
    setPkg(data.package);
    setStatus("Package saved.");
    if (isNew) router.replace(`/admin/packages/${data.package.id}/edit`);
  }

  if (loading) return <p className="text-sm text-viaje-soft">Loading package...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-viaje-red">Packages</p>
          <h1 className="mt-2 text-3xl font-bold text-viaje-navy">{isNew ? "New Package" : "Package Editor"}</h1>
        </div>
        <Button className="w-fit" onClick={save} disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving..." : "Save Package"}</Button>
      </div>
      {status && <p className="rounded-[8px] border border-viaje-line bg-white p-3 text-sm text-viaje-soft">{status}</p>}

      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextField label="Title" value={pkg.title} onChange={(value) => update({ title: value, slug: pkg.slug || slugify(value) })} />
          <TextField label="Slug" value={pkg.slug} onChange={(value) => update({ slug: slugify(value) })} />
          <TextField label="Destination" value={pkg.destination} onChange={(value) => update({ destination: value })} />
          <TextField label="Country" value={pkg.country} onChange={(value) => update({ country: value })} />
          <SelectField label="Type" value={pkg.type} options={packageTypes} onChange={(value) => update({ type: value as TravelPackage["type"] })} />
          <SelectField label="Status" value={pkg.status} options={packageStatuses} onChange={(value) => update({ status: value as TravelPackage["status"] })} />
          <TextField label="Duration" value={pkg.duration} onChange={(value) => update({ duration: value })} />
          <TextField label="Price" type="number" value={pkg.price} onChange={(value) => update({ price: Number(value) })} />
          <div className="md:col-span-2">
            <label className={fieldClass}>
              <span className={labelClass}>Description</span>
              <textarea className={textareaClass} value={pkg.description} onChange={(event) => update({ description: event.target.value })} />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Media</CardTitle></CardHeader>
        <CardContent className="grid gap-5">
          <div className="max-w-md">
            <PackageMediaField label="Cover Image" folder="packages/covers" value={pkg.coverImageUrl} onUploaded={(value) => update({ coverImageUrl: value })} />
          </div>
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className={labelClass}>Gallery</span>
              <Button type="button" size="sm" variant="outline" className="w-fit" onClick={() => update({ galleryUrls: [...pkg.galleryUrls, ""] })}><Plus className="h-3.5 w-3.5" />Add Image</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {pkg.galleryUrls.map((url, index) => (
                <div key={index} className="rounded-[8px] border border-viaje-line p-3">
                  <PackageMediaField label={`Gallery ${index + 1}`} folder="packages/gallery" value={url} onUploaded={(value) => update({ galleryUrls: pkg.galleryUrls.map((item, itemIndex) => itemIndex === index ? value : item) })} />
                  <Button type="button" size="sm" variant="ghost" className="mt-2 w-fit text-viaje-red" onClick={() => update({ galleryUrls: pkg.galleryUrls.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="h-3.5 w-3.5" />Remove</Button>
                </div>
              ))}
            </div>
          </div>
          <TextField label="Brochure URL" value={pkg.brochureUrl ?? ""} onChange={(value) => update({ brochureUrl: value })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Travel Dates</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          {pkg.travelDates.map((travelDate, index) => (
            <div key={travelDate.id} className="grid gap-3 rounded-[8px] border border-viaje-line p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-end">
              <TextField label="Date Start" type="date" value={travelDate.startDate} onChange={(value) => update({ travelDates: pkg.travelDates.map((item, itemIndex) => itemIndex === index ? { ...item, startDate: value } : item) })} />
              <TextField label="Date End" type="date" value={travelDate.endDate} onChange={(value) => update({ travelDates: pkg.travelDates.map((item, itemIndex) => itemIndex === index ? { ...item, endDate: value } : item) })} />
              <TextField label="Additional Amount" type="number" value={travelDate.additionalAmount} onChange={(value) => update({ travelDates: pkg.travelDates.map((item, itemIndex) => itemIndex === index ? { ...item, additionalAmount: Number(value) } : item) })} />
              <SelectField label="Availability" value={travelDate.availabilityStatus} options={packageAvailabilityStatuses} onChange={(value) => update({ travelDates: pkg.travelDates.map((item, itemIndex) => itemIndex === index ? { ...item, availabilityStatus: value as TravelPackage["travelDates"][number]["availabilityStatus"] } : item) })} />
              <Button type="button" variant="ghost" className="w-fit text-viaje-red" onClick={() => update({ travelDates: pkg.travelDates.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-fit" onClick={() => update({ travelDates: [...pkg.travelDates, { id: `date-${Date.now()}`, startDate: "", endDate: "", additionalAmount: 0, availabilityStatus: "available" }] })}><Plus className="h-4 w-4" />Add Travel Date</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Itinerary</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          {pkg.itinerary.map((day, index) => (
            <div key={index} className="grid gap-4 rounded-[8px] border border-viaje-line p-4">
              <div className="grid gap-4 md:grid-cols-[1fr_280px_auto] md:items-end">
                <TextField label="Day" value={day.day} onChange={(value) => update({ itinerary: pkg.itinerary.map((item, itemIndex) => itemIndex === index ? { ...item, day: value } : item) })} />
                <PackageMediaField label="Itinerary Image" folder="packages/itinerary" value={day.imageUrl} onUploaded={(value) => update({ itinerary: pkg.itinerary.map((item, itemIndex) => itemIndex === index ? { ...item, imageUrl: value } : item) })} />
                <Button type="button" variant="ghost" className="w-fit text-viaje-red" onClick={() => update({ itinerary: pkg.itinerary.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <span className={labelClass}>Activities</span>
                  <Button type="button" size="sm" variant="outline" className="w-fit" onClick={() => update({ itinerary: pkg.itinerary.map((item, itemIndex) => itemIndex === index ? { ...item, activities: [...item.activities, { activity: "", icon: "MapPin" }] } : item) })}><Plus className="h-3.5 w-3.5" />Add Activity</Button>
                </div>
                {day.activities.map((activity, activityIndex) => (
                  <div key={activityIndex} className="grid gap-3 md:grid-cols-[1fr_180px_auto] md:items-center">
                    <Input value={activity.activity} placeholder="Activity" onChange={(event) => update({ itinerary: pkg.itinerary.map((item, itemIndex) => itemIndex === index ? { ...item, activities: item.activities.map((inner, innerIndex) => innerIndex === activityIndex ? { ...inner, activity: event.target.value } : inner) } : item) })} />
                    <Input value={activity.icon} placeholder="Icon" onChange={(event) => update({ itinerary: pkg.itinerary.map((item, itemIndex) => itemIndex === index ? { ...item, activities: item.activities.map((inner, innerIndex) => innerIndex === activityIndex ? { ...inner, icon: event.target.value } : inner) } : item) })} />
                    <Button type="button" size="sm" variant="ghost" className="w-fit text-viaje-red" onClick={() => update({ itinerary: pkg.itinerary.map((item, itemIndex) => itemIndex === index ? { ...item, activities: item.activities.filter((_, innerIndex) => innerIndex !== activityIndex) } : item) })}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-fit" onClick={() => update({ itinerary: [...pkg.itinerary, { day: `Day ${pkg.itinerary.length + 1}`, imageUrl: "", activities: [] }] })}><Plus className="h-4 w-4" />Add Itinerary Day</Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card><CardHeader><CardTitle>Inclusions</CardTitle></CardHeader><CardContent><StringListEditor label="Inclusions" values={pkg.inclusions} onChange={(values) => update({ inclusions: values })} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Exclusions</CardTitle></CardHeader><CardContent><StringListEditor label="Exclusions" values={pkg.exclusions} onChange={(values) => update({ exclusions: values })} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Requirements</CardTitle></CardHeader><CardContent><StringListEditor label="Requirements" values={pkg.requirements} onChange={(values) => update({ requirements: values })} /></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Add-ons</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          {pkg.addons.map((addon, index) => (
            <div key={addon.id} className="grid gap-3 rounded-[8px] border border-viaje-line p-4 md:grid-cols-[1fr_180px_auto] md:items-end">
              <TextField label="Label" value={addon.label} onChange={(value) => update({ addons: pkg.addons.map((item, itemIndex) => itemIndex === index ? { ...item, label: value } : item) })} />
              <TextField label="Price" type="number" value={addon.price} onChange={(value) => update({ addons: pkg.addons.map((item, itemIndex) => itemIndex === index ? { ...item, price: Number(value) } : item) })} />
              <Button type="button" variant="ghost" className="w-fit text-viaje-red" onClick={() => update({ addons: pkg.addons.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-fit" onClick={() => update({ addons: [...pkg.addons, { id: `addon-${Date.now()}`, label: "", price: 0 }] })}><Plus className="h-4 w-4" />Add Add-on</Button>
        </CardContent>
      </Card>
    </div>
  );
}
