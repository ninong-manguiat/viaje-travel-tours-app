import Image from "next/image";
import { PackageListingClient } from "@/components/domain/package-listing-client";
import { listPublishedPackages } from "@/lib/package-data";
import { Phone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  const packages = await listPublishedPackages();

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
        <PackageListingClient packages={packages} />
      </section>
    </main>
  );
}
