"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PackageCard } from "@/components/domain/package-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { TravelPackage } from "@/lib/types";

const filters = ["All", "Domestic", "International"] as const;

function packageMatchesFilter(pkg: TravelPackage, filter: string) {
  if (filter === "All") return true;
  if (filter === "Domestic") return pkg.type === "domestic";
  if (filter === "International") return pkg.type === "international";
  return true;
}

function packageMatchesSearch(pkg: TravelPackage, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [
    pkg.title,
    pkg.destination,
    pkg.country,
    pkg.duration,
    pkg.description,
    pkg.type,
  ].join(" ").toLowerCase().includes(normalizedQuery);
}

export function PackageListingClient({ packages }: { packages: TravelPackage[] }) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");
  const visiblePackages = useMemo(() => (
    packages.filter((pkg) => packageMatchesFilter(pkg, activeFilter) && packageMatchesSearch(pkg, query))
  ), [activeFilter, packages, query]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Available Packages</p>
          <h2 className="mt-2 text-3xl text-viaje-navy">{visiblePackages.length} curated trip{visiblePackages.length === 1 ? "" : "s"}</h2>
        </div>
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-viaje-soft" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search destination or package" className="pl-10" />
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        {filters.map((filter) => {
          const selected = filter === activeFilter;
          return (
            <button key={filter} type="button" onClick={() => setActiveFilter(filter)}>
              <Badge className={selected ? "border-viaje-red bg-viaje-red px-3.5 py-2 text-[12.5px] text-white" : "border-viaje-line bg-white px-3.5 py-2 text-[12.5px] text-viaje-soft"}>
                {filter}
              </Badge>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {visiblePackages.map((item) => <PackageCard key={item.id} item={item} />)}
        {!visiblePackages.length && (
          <div className="rounded-[10px] border border-dashed border-viaje-line bg-white p-6 text-sm text-viaje-soft md:col-span-2 lg:col-span-3">
            No packages match your search or selected filter.
          </div>
        )}
      </div>
    </>
  );
}
