"use client";

import { useEffect, useState } from "react";
import type { DragEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { PackageGalleryMediaField, PackageMediaField } from "@/components/admin/package-media-field";
import { IconSelect } from "@/components/admin/website-content-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { airlineOptions, getAirline } from "@/lib/airlines";
import { newPackage, packageAvailabilityStatuses, packageStatuses, packageTypes } from "@/lib/package-content";
import type { TravelPackage } from "@/lib/types";
import { cmsIconOptions, type CmsIconName } from "@/lib/website-content";

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

function PriceField({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <label className={fieldClass}>
      <span className={labelClass}>Price</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-viaje-soft">₱</span>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(Number.isFinite(event.target.valueAsNumber) ? event.target.valueAsNumber : 0)}
          className="pl-8"
        />
      </div>
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

function AirlineSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const selectedAirline = getAirline(value);

  return (
    <label className={fieldClass}>
      <span className={labelClass}>Airline</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex h-11 w-full items-center justify-between gap-3 rounded-[10px] border border-viaje-line bg-viaje-paper px-3.5 text-left text-sm font-medium text-viaje-ink outline-none transition hover:border-viaje-red focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={open}
        >
          <span className="flex min-w-0 items-center gap-2">
            <img src={selectedAirline.logoSrc} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
            <span className="truncate">{selectedAirline.name}</span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-viaje-soft transition ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-[10px] border border-viaje-line bg-white p-1.5 shadow-[0_18px_40px_-24px_rgba(15,36,56,0.55)]">
            {airlineOptions.map((airline) => {
              const selected = airline.name === selectedAirline.name;
              return (
                <button
                  key={airline.name}
                  type="button"
                  onClick={() => {
                    onChange(airline.name);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-left text-sm transition hover:bg-viaje-paperAlt ${
                    selected ? "bg-viaje-red/10 font-semibold text-viaje-red" : "text-viaje-ink"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <img src={airline.logoSrc} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
                    <span className="truncate">{airline.name}</span>
                  </span>
                  {selected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
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

type ItineraryItem = TravelPackage["itinerary"][number];

function itineraryIcon(item: ItineraryItem) {
  return item.icon || item.activities[0]?.icon || "MapPin";
}

function cmsIcon(value: string): CmsIconName {
  return cmsIconOptions.includes(value as CmsIconName) ? value as CmsIconName : "MapPin";
}

function activitiesToText(activities: ItineraryItem["activities"]) {
  return activities.map((item) => item.activity).join("\n");
}

function activitiesFromText(value: string, icon: string): ItineraryItem["activities"] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((activity) => ({ activity, icon: icon || "MapPin" }));
}

function reorderItems<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function ItineraryAccordionItem({
  item,
  index,
  selected,
  isDragging,
  dragLabel,
  onSelect,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  item: ItineraryItem;
  index: number;
  selected: boolean;
  isDragging?: boolean;
  dragLabel?: string;
  onSelect: () => void;
  onRemove: () => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const title = `${item.day || `Day ${index + 1}`} : ${item.name || "Untitled Itinerary"}`;

  return (
    <div
      className={`overflow-visible rounded-[10px] border bg-white transition ${selected ? "border-viaje-red" : "border-viaje-line"} ${isDragging ? "opacity-50" : ""}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-2 px-5 py-4">
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
        <button
          type="button"
          onClick={() => {
            setOpen((current) => !current);
            onSelect();
          }}
          className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left"
          aria-expanded={open}
        >
          <span className="min-w-0 truncate font-serif text-xl font-semibold text-viaje-navy">{title}</span>
          <ChevronDown className={`h-5 w-5 text-viaje-soft transition ${open ? "rotate-180" : ""}`} />
        </button>
        <Button type="button" size="icon" variant="ghost" className="text-viaje-red" onClick={onRemove} aria-label={`Remove ${title}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {open && (
        <div className="grid gap-3 border-t border-viaje-line p-5 text-sm text-viaje-soft">
          <p><span className="font-semibold text-viaje-navy">Icon:</span> {itineraryIcon(item)}</p>
          <p><span className="font-semibold text-viaje-navy">Activities:</span> {item.activities.length}</p>
          <Button type="button" variant="outline" className="w-fit" onClick={onSelect}>Edit Itinerary</Button>
        </div>
      )}
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
  const [selectedItineraryIndex, setSelectedItineraryIndex] = useState(0);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [showLeavePrompt, setShowLeavePrompt] = useState(false);
  const [draggedItineraryIndex, setDraggedItineraryIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isNew) {
      setSavedSnapshot(JSON.stringify(pkg));
      return;
    }
    fetch(`/api/admin/packages/${packageId}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load package")))
      .then((data) => {
        setPkg(data.package);
        setSavedSnapshot(JSON.stringify(data.package));
      })
      .catch(() => setStatus("Unable to load package."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, packageId]);

  const hasUnsavedChanges = savedSnapshot ? JSON.stringify(pkg) !== savedSnapshot : false;

  function update(value: Partial<TravelPackage>) {
    setPkg((current) => ({ ...current, ...value }));
  }

  function updateItinerary(index: number, value: Partial<ItineraryItem>) {
    update({ itinerary: pkg.itinerary.map((item, itemIndex) => itemIndex === index ? { ...item, ...value } : item) });
  }

  function addItinerary() {
    const nextIndex = pkg.itinerary.length;
    update({
      itinerary: [
        ...pkg.itinerary,
        { day: `Day ${nextIndex + 1}`, name: "", icon: "MapPin", imageUrl: "", activities: [] },
      ],
    });
    setSelectedItineraryIndex(nextIndex);
  }

  function removeItinerary(index: number) {
    const nextItinerary = pkg.itinerary.filter((_, itemIndex) => itemIndex !== index);
    update({ itinerary: nextItinerary });
    setSelectedItineraryIndex((current) => Math.max(0, Math.min(current > index ? current - 1 : current, nextItinerary.length - 1)));
  }

  function startItineraryDrag(index: number, event: DragEvent<HTMLButtonElement>) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `itinerary:${index}`);
    setDraggedItineraryIndex(index);
  }

  function allowItineraryDrop(event: DragEvent<HTMLDivElement>) {
    if (draggedItineraryIndex === null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function dropItinerary(toIndex: number, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (draggedItineraryIndex === null || draggedItineraryIndex === toIndex) {
      setDraggedItineraryIndex(null);
      return;
    }

    update({ itinerary: reorderItems(pkg.itinerary, draggedItineraryIndex, toIndex) });
    setSelectedItineraryIndex((current) => {
      if (current === draggedItineraryIndex) return toIndex;
      if (draggedItineraryIndex < current && toIndex >= current) return current - 1;
      if (draggedItineraryIndex > current && toIndex <= current) return current + 1;
      return current;
    });
    setDraggedItineraryIndex(null);
  }

  async function save({ redirectNew = true } = {}) {
    setSaving(true);
    setStatus("");
    const packagePayload = { ...pkg, slug: pkg.slug || slugify(pkg.title) };
    const payload = { package: packagePayload };
    const response = await fetch(isNew ? "/api/admin/packages" : `/api/admin/packages/${pkg.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSaving(false);

    if (!response.ok) {
      setStatus("Unable to save package.");
      return false;
    }

    const data = await response.json();
    setPkg(data.package);
    setSavedSnapshot(JSON.stringify(data.package));
    setStatus("Package saved.");
    if (isNew && redirectNew) router.replace(`/admin/packages/${data.package.id}/edit`);
    return true;
  }

  function handleBack() {
    if (!hasUnsavedChanges) {
      router.push("/admin/packages");
      return;
    }
    setShowLeavePrompt(true);
  }

  if (loading) return <p className="text-sm text-viaje-soft">Loading package...</p>;

  const selectedItinerary = pkg.itinerary[selectedItineraryIndex] ?? null;
  const selectedItineraryIcon = selectedItinerary ? itineraryIcon(selectedItinerary) : "MapPin";
  const selectedCmsItineraryIcon = cmsIcon(selectedItineraryIcon);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-viaje-red">Packages</p>
          <h1 className="mt-2 text-3xl font-bold text-viaje-navy">{isNew ? "New Package" : "Package Editor"}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="w-fit" onClick={handleBack}><ArrowLeft className="h-4 w-4" />Back</Button>
          <Button className="w-fit" onClick={() => save()} disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving..." : "Save Package"}</Button>
        </div>
      </div>
      {status && <p className="rounded-[8px] border border-viaje-line bg-white p-3 text-sm text-viaje-soft">{status}</p>}
      {showLeavePrompt && (
        <div className="rounded-[12px] border border-viaje-line bg-white p-4 shadow-[0_20px_40px_-32px_rgba(15,36,56,0.45)]">
          <p className="font-semibold text-viaje-navy">You have unsaved changes.</p>
          <p className="mt-1 text-sm text-viaje-soft">Save this package before leaving, or discard the changes and return to Package Management.</p>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" className="w-fit" onClick={() => setShowLeavePrompt(false)}>Cancel</Button>
            <Button type="button" variant="outline" className="w-fit" onClick={() => router.push("/admin/packages")}>Discard and Leave</Button>
            <Button
              type="button"
              className="w-fit"
              disabled={saving}
              onClick={async () => {
                const saved = await save({ redirectNew: false });
                if (saved) router.push("/admin/packages");
              }}
            >
              <Save className="h-4 w-4" />
              Save and Leave
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <TextField label="Title" value={pkg.title} onChange={(value) => update({ title: value, slug: slugify(value) })} />
            <TextField label="Slug" value={pkg.slug} onChange={(value) => update({ slug: slugify(value) })} />
            <TextField label="Destination" value={pkg.destination} onChange={(value) => update({ destination: value })} />
            <TextField label="Country" value={pkg.country} onChange={(value) => update({ country: value })} />
            <SelectField label="Type" value={pkg.type} options={packageTypes} onChange={(value) => update({ type: value as TravelPackage["type"] })} />
            <SelectField label="Status" value={pkg.status} options={packageStatuses} onChange={(value) => update({ status: value as TravelPackage["status"] })} />
            <TextField label="Duration" value={pkg.duration} onChange={(value) => update({ duration: value })} />
            <PriceField value={pkg.price} onChange={(value) => update({ price: value })} />
            <AirlineSelect value={pkg.airline ?? ""} onChange={(value) => update({ airline: value })} />
            <TextField label="Hotel" value={pkg.hotel ?? ""} onChange={(value) => update({ hotel: value })} />
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
            <div className="max-w-[220px]">
              <span className={labelClass}>Cover Image</span>
              <div className="mt-2">
                <PackageMediaField label="Cover Image" folder="packages/covers" value={pkg.coverImageUrl} onUploaded={(value) => update({ coverImageUrl: value })} />
              </div>
            </div>
            <PackageGalleryMediaField label="Gallery" folder="packages/gallery" values={pkg.galleryUrls} onChange={(galleryUrls) => update({ galleryUrls })} />
          </CardContent>
        </Card>
      </div>

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
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Itinerary</CardTitle>
          <Button type="button" variant="outline" className="w-fit" onClick={addItinerary}><Plus className="h-4 w-4" />Add Itinerary Day</Button>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="grid gap-4 rounded-[10px] border border-viaje-line p-4">
            <h3 className="font-serif text-xl font-semibold text-viaje-navy">Itinerary Form</h3>
            {selectedItinerary ? (
              <>
                <TextField label="Day" value={selectedItinerary.day} onChange={(value) => updateItinerary(selectedItineraryIndex, { day: value })} />
                <TextField label="Itinerary Name" value={selectedItinerary.name ?? ""} onChange={(value) => updateItinerary(selectedItineraryIndex, { name: value })} />
                <label className={fieldClass}>
                  <span className={labelClass}>Icon</span>
                  <IconSelect
                    value={selectedCmsItineraryIcon}
                    onChange={(value) => updateItinerary(selectedItineraryIndex, {
                      icon: value,
                      activities: selectedItinerary.activities.map((activity) => ({ ...activity, icon: value })),
                    })}
                  />
                </label>
                <label className={fieldClass}>
                  <span className={labelClass}>Activities</span>
                  <textarea
                    className={textareaClass}
                    value={activitiesToText(selectedItinerary.activities)}
                    onChange={(event) => updateItinerary(selectedItineraryIndex, { activities: activitiesFromText(event.target.value, selectedCmsItineraryIcon) })}
                    placeholder="One activity per line"
                  />
                </label>
                <div className="max-w-[220px]">
                  <span className={labelClass}>Itinerary Image</span>
                  <div className="mt-2">
                    <PackageMediaField label="Itinerary Image" folder="packages/itinerary" value={selectedItinerary.imageUrl} onUploaded={(value) => updateItinerary(selectedItineraryIndex, { imageUrl: value })} />
                  </div>
                </div>
              </>
            ) : (
              <p className="rounded-[10px] border border-dashed border-viaje-line bg-viaje-paper p-4 text-sm text-viaje-soft">Add an itinerary day to start editing.</p>
            )}
          </div>

          <div className="grid content-start gap-4">
            {pkg.itinerary.length ? (
              pkg.itinerary.map((item, index) => (
                <ItineraryAccordionItem
                  key={index}
                  item={item}
                  index={index}
                  selected={index === selectedItineraryIndex}
                  isDragging={draggedItineraryIndex === index}
                  dragLabel={`Reorder ${item.day || `Day ${index + 1}`}`}
                  onSelect={() => setSelectedItineraryIndex(index)}
                  onRemove={() => removeItinerary(index)}
                  onDragStart={(event) => startItineraryDrag(index, event)}
                  onDragOver={allowItineraryDrop}
                  onDrop={(event) => dropItinerary(index, event)}
                  onDragEnd={() => setDraggedItineraryIndex(null)}
                />
              ))
            ) : (
              <p className="rounded-[10px] border border-dashed border-viaje-line bg-viaje-paper p-4 text-sm text-viaje-soft">No itinerary days added yet.</p>
            )}
          </div>
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
