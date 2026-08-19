import Image from "next/image";
import { PackageCard } from "@/components/domain/package-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { packages } from "@/lib/sample-data";
import { Phone, Search, SlidersHorizontal } from "lucide-react";

export default function PackagesPage() {
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
          <div className="max-w-3xl py-14">
            <p className="eyebrow text-viaje-gold">Browse Tours</p>
            <h1 className="mt-3 text-[clamp(2.55rem,5vw,4.8rem)] leading-[0.95]">Package Listing</h1>
            <p className="mt-5 max-w-2xl text-[17px] leading-7 text-white/76">Choose from featured domestic and international departures curated by Viaje Travel and Tours.</p>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Available Packages</p>
            <h2 className="mt-2 text-3xl text-viaje-navy">{packages.length} curated trips</h2>
          </div>
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-viaje-soft" />
            <Input placeholder="Search destination or package" className="pl-10" />
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          {["All", "Domestic", "International", "September", "October", "Budget", "Family", "Group Departure"].map((filter, index) => (
            <Badge key={filter} className={index === 0 ? "border-viaje-red bg-viaje-red px-3.5 py-2 text-[12.5px] text-white" : "border-viaje-line bg-white px-3.5 py-2 text-[12.5px] text-viaje-soft"}>
              {filter}
            </Badge>
          ))}
          <Button variant="outline" size="sm" className="gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Recommended
          </Button>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((item) => <PackageCard key={item.id} item={item} />)}
        </div>
        </section>
    </main>
  );
}
