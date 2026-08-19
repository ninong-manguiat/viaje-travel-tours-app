import { PackageCard } from "@/components/domain/package-card";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { packages } from "@/lib/sample-data";

export default function PackagesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-viaje-navy via-viaje-navy2 to-viaje-navy3 py-14 text-white before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_90%_10%,rgba(216,154,61,0.16),transparent_45%)]">
          <div className="container-page relative">
            <p className="font-mono text-[11.5px] font-medium uppercase tracking-[0.1em] text-viaje-gold">Browse tours</p>
            <h1 className="mt-3 text-[38px] font-medium">Package Listing</h1>
            <p className="mt-3 max-w-xl text-[15.5px] text-white/70">Filters are wired as UI placeholders and ready to bind to Firestore package queries.</p>
          </div>
        </section>
        <section className="container-page py-12">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-viaje-soft"><b className="text-viaje-ink">{packages.length}</b> curated packages available</p>
          </div>
          <Input placeholder="Search destination, country, or package" className="md:max-w-sm" />
        </div>
        <div className="mb-8 flex flex-wrap gap-2">
          {["All", "Domestic", "International", "September", "October", "Budget", "Family", "Group Departure"].map((filter) => (
            <Badge key={filter} className="border-viaje-line bg-white px-3.5 py-2 text-[12.5px] font-semibold text-viaje-soft first:bg-viaje-red first:text-white">{filter}</Badge>
          ))}
          <Button variant="outline" size="sm">Sort: Recommended</Button>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((item) => <PackageCard key={item.id} item={item} />)}
        </div>
        </section>
      </main>
    </>
  );
}
