"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Anchor,
  ArrowLeft,
  BadgeCheck,
  Building,
  Building2,
  Bus,
  Calendar,
  CalendarCheck,
  Car,
  Check,
  ChevronRight,
  Minus,
  Facebook,
  FileCheck,
  FileText,
  Globe2,
  Hotel,
  IdCard,
  ImageIcon,
  Landmark,
  Map,
  MapPin,
  MapPinned,
  Phone,
  Plane,
  PlaneTakeoff,
  Plus,
  ReceiptText,
  Route,
  Save,
  ShieldCheck,
  Ship,
  ShipWheel,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { getAirline } from "@/lib/airlines";
import type { TravelPackage } from "@/lib/types";
import type { CmsIconName } from "@/lib/website-content";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatPeso } from "@/lib/utils";

const iconMap: Partial<Record<CmsIconName, LucideIcon>> = {
  Anchor,
  BadgeCheck,
  Building,
  Building2,
  Bus,
  CalendarCheck,
  Car,
  Check,
  Facebook,
  FileCheck,
  FileText,
  Globe2,
  Hotel,
  IdCard,
  ImageIcon,
  Landmark,
  Map,
  MapPin,
  MapPinned,
  Phone,
  Plane,
  PlaneTakeoff,
  Plus,
  ReceiptText,
  Route,
  Save,
  ShieldCheck,
  Ship,
  ShipWheel,
  Sparkles,
  Trash2,
  UploadCloud,
};

function PackageIcon({ name, className = "h-5 w-5 text-viaje-red" }: { name?: string; className?: string }) {
  const Icon = iconMap[name as CmsIconName] ?? MapPin;
  return <Icon className={className} />;
}

function PaxCounter({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <>
    <h2 className="mb-4 text-2xl font-bold text-viaje-navy">Number of Guests</h2>
    <Card className="rounded-lg">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <h2 className="text-l font-bold text-viaje-navy">Headcount</h2>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" size="icon" variant="outline" onClick={() => onChange(Math.max(1, value - 1))} aria-label="Decrease pax">
            <Minus className="h-4 w-4" />
          </Button>
          <span className="min-w-10 text-center text-2xl font-bold text-viaje-navy">{value}</span>
          <Button type="button" size="icon" variant="outline" onClick={() => onChange(value + 1)} aria-label="Increase pax">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
    </>
  );
}

export function PackageDetailClient({ pkg }: { pkg: TravelPackage }) {
  const [selectedDepartureId, setSelectedDepartureId] = useState(pkg.travelDates[0]?.id ?? "");
  const [selectedAddonId, setSelectedAddonId] = useState("none");
  const [pax, setPax] = useState(1);
  const airline = getAirline(pkg.airline);
  const selectedDeparture = pkg.travelDates.find((date) => date.id === selectedDepartureId) ?? pkg.travelDates[0] ?? null;
  const selectedAddon = pkg.addons.find((addon) => addon.id === selectedAddonId) ?? null;
  const additionalAmount = selectedDeparture?.additionalAmount ?? 0;
  const addonAmount = selectedAddon?.price ?? 0;
  const amountPerPax = pkg.price + additionalAmount + addonAmount;
  const finalAmount = amountPerPax * pax;
  const gallery = [pkg.coverImageUrl, ...pkg.galleryUrls].filter(Boolean);

  return (
    <main>
      <section className="relative overflow-hidden bg-gradient-to-br from-viaje-navy via-viaje-navy2 to-viaje-navy3 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_8%,rgba(216,154,61,0.20),transparent_38%)]" />
        <div className="container-page relative py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <a href="/" className="inline-flex items-center gap-3">
              <Image src="/brand/viaje-logo-white.png" alt="Viaje Travel and Tours" width={58} height={58} className="h-14 w-14 object-contain" priority />
              <span className="font-serif text-xl font-semibold">Viaje Travel and Tours</span>
            </a>
            <a href="tel:+639158375470" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-viaje-red px-5 text-sm font-semibold text-white transition hover:bg-viaje-red2">
              <Phone className="h-4 w-4" />
              Call 0915 837 5470
            </a>
          </div>
          <div className="grid gap-8 py-12 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <Link href="/packages" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white/78 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Back to packages
              </Link>
              <p className="eyebrow text-viaje-gold">{pkg.destination}</p>
              <h1 className="mt-3 text-[clamp(2.55rem,5vw,4.8rem)] leading-[0.95]">{pkg.title}</h1>
              <p className="mt-5 max-w-2xl text-[17px] leading-7 text-white/76">{pkg.description}</p>
            </div>
            {pkg.coverImageUrl && <img src={pkg.coverImageUrl} alt={pkg.title} className="h-[280px] w-full rounded-lg object-cover shadow-[0_24px_60px_-34px_rgba(0,0,0,0.65)]" />}
          </div>
        </div>
      </section>

      <section className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">

          {gallery.length > 0 && (
            <section>
              <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
                <div className="grid grid-cols-2 gap-3">
                  {gallery.slice(1, 5).map((image, index) => (
                    <img key={`${image}-${index}`} src={image} alt={`${pkg.title} gallery ${index + 2}`} className="h-[154px] w-full rounded-lg object-cover" />
                  ))}
                </div>
              </div>
            </section>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft">Duration</p>
              <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-viaje-navy"><Calendar className="h-5 w-5 text-viaje-red" />{pkg.duration}</h2>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft">Airline</p>
              <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-viaje-navy"><img src={airline.logoSrc} alt="" className="h-7 w-7 rounded-full object-cover" />{airline.name}</h2>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft">Hotel</p>
              <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-viaje-navy"><Hotel className="h-5 w-5 text-viaje-red" />{pkg.hotel || "Hotel details to be announced"}</h2>
            </div>
          </div>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-viaje-navy">Departure Dates</h2>
            <div className="grid gap-3">
              {pkg.travelDates.map((dep) => {
                const selected = dep.id === selectedDeparture?.id;
                return (
                  <button key={dep.id} type="button" onClick={() => setSelectedDepartureId(dep.id)} className="text-left">
                    <Card className={`rounded-lg transition ${selected ? "border-viaje-red ring-2 ring-viaje-red/20" : ""}`}>
                      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <div>
                          <p className="font-semibold">{formatDate(dep.startDate)} - {formatDate(dep.endDate)}</p>
                          <p className="text-sm text-muted-foreground">Additional amount {formatPeso(dep.additionalAmount)}</p>
                        </div>
                        <StatusBadge status={dep.availabilityStatus} />
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
              {!pkg.travelDates.length && (
                <Card className="rounded-lg">
                  <CardContent className="p-4 text-sm text-viaje-soft">Departure dates to be announced.</CardContent>
                </Card>
              )}
            </div>
          </section>


          {pkg.addons.length > 0 && (
            <section>
              <h2 className="mb-4 text-2xl font-bold text-viaje-navy">Add-ons</h2>
              <div className="grid gap-3">
                <button type="button" onClick={() => setSelectedAddonId("none")} className="text-left">
                  <Card className={`rounded-lg transition ${selectedAddonId === "none" ? "border-viaje-red ring-2 ring-viaje-red/20" : ""}`}>
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <span className="font-medium text-viaje-navy">None</span>
                      <strong>{formatPeso(0)}</strong>
                    </CardContent>
                  </Card>
                </button>
                {pkg.addons.map((addon) => {
                  const selected = addon.id === selectedAddonId;
                  return (
                    <button key={addon.id} type="button" onClick={() => setSelectedAddonId(addon.id)} className="text-left">
                      <Card className={`rounded-lg transition ${selected ? "border-viaje-red ring-2 ring-viaje-red/20" : ""}`}>
                        <CardContent className="flex items-center justify-between gap-4 p-4">
                      <span className="font-medium text-viaje-navy">{addon.label}</span>
                      <strong>{formatPeso(addon.price)}</strong>
                        </CardContent>
                      </Card>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <PaxCounter value={pax} onChange={setPax} />
          </section>

          {pkg.itinerary.length > 0 && (
            <section>
              <h2 className="mb-4 text-2xl font-bold text-viaje-navy">Itinerary</h2>
              <div className="grid gap-4">
                {pkg.itinerary.map((item, index) => (
                  <Card key={`${item.day}-${index}`} className="rounded-lg overflow-hidden">
                    <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_180px]">
                      <div>
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-viaje-soft">{item.day}</p>
                            <h3 className="text-xl font-bold text-viaje-navy">{item.name || item.day}</h3>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          {item.activities.map((activity, activityIndex) => (
                            <p key={`${activity.activity}-${activityIndex}`} className="flex gap-2 text-sm text-viaje-ink">
                              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-viaje-red" />
                              {activity.activity}
                            </p>
                          ))}
                        </div>
                      </div>
                      {item.imageUrl && <img src={item.imageUrl} alt={item.name || item.day} className="h-40 w-full rounded-lg object-cover" />}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <h2 className="mb-4 text-2xl font-bold text-viaje-navy">Package Details & Requirements</h2>
          <section className="grid gap-5 md:grid-cols-2">
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Inclusions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pkg.inclusions.map((item) => (
                  <p key={item} className="flex gap-2">
                    <Check className="h-5 w-5 shrink-0 text-emerald-600" />
                    {item}
                  </p>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>Exclusions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pkg.exclusions.map((item) => (
                  <p key={item} className="flex gap-2">
                    <X className="h-5 w-5 shrink-0 text-viaje-red" />
                    {item}
                  </p>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-lg md:col-span-2">
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pkg.requirements.map((item) => (
                  <p key={item} className="flex gap-2">
                    <FileCheck className="h-5 w-5 shrink-0 text-viaje-red" />
                    {item}
                  </p>
                ))}
              </CardContent>
            </Card>
          </section>

        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between"><span>Base package price</span><strong>{formatPeso(pkg.price)}</strong></div>
              <div className="flex justify-between"><span>Selected departure</span><span>{selectedDeparture ? formatDate(selectedDeparture.startDate) : "TBD"}</span></div>
              {additionalAmount > 0 && <div className="flex justify-between"><span>Departure additional amount</span><strong>{formatPeso(additionalAmount)}</strong></div>}
              {selectedAddon && <div className="flex justify-between"><span>Selected add-on</span><strong>{formatPeso(addonAmount)}</strong></div>}
              <div className="flex justify-between"><span>Pax</span><strong>x {pax}</strong></div>
              <div className="border-t border-viaje-line pt-4">
                <div className="flex justify-between text-lg"><span className="font-semibold">Final Amount</span><strong>{formatPeso(finalAmount)}</strong></div>
                <br/>
              </div>
              <Link href={`/book/${pkg.id}?departureId=${selectedDeparture?.id ?? ""}`}><Button className="w-full">Book This Package</Button></Link>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}
