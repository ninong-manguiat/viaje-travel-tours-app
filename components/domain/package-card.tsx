import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPeso } from "@/lib/utils";
import type { TravelPackage } from "@/lib/types";

export function PackageCard({ item }: { item: TravelPackage }) {
  return (
    <article className="relative overflow-hidden rounded-[8px] border border-viaje-line bg-white shadow-[0_20px_40px_-28px_rgba(15,36,56,0.35)]">
      <div className="relative h-[170px]">
        <img src={item.coverImageUrl} alt={item.title} className="h-full w-full object-cover" />
        <span className="absolute left-3.5 top-3.5 rounded-full bg-viaje-red px-3 py-1.5 text-[11px] font-bold text-white">Featured</span>
        <span className="absolute right-3.5 top-3.5 rounded-full bg-viaje-navy/75 px-2.5 py-1.5 text-[10.5px] font-semibold capitalize text-white">{item.type}</span>
      </div>
      <div className="px-5 pt-4">
        <p className="flex items-center gap-1 text-[12.5px] text-viaje-soft">
          <MapPin className="h-4 w-4" />
          {item.destination}
        </p>
        <h3 className="mt-1 font-serif text-[19px] font-semibold text-viaje-ink">{item.title}</h3>
      </div>
      <div className="my-4 flex items-center gap-2 text-viaje-line">
        <span className="h-3.5 w-3.5 rounded-full border border-viaje-line bg-viaje-paper" />
        <span className="flex-1 border-t border-dashed border-viaje-line" />
        <span className="h-3.5 w-3.5 rounded-full border border-viaje-line bg-viaje-paper" />
      </div>
      <div className="flex justify-between px-5 pb-4 font-mono text-[11px] text-viaje-soft">
        <div>
          Duration
          <b className="mt-0.5 block font-sans text-[12.5px] font-bold text-viaje-ink">{item.duration}</b>
        </div>
        <div>
          Country
          <b className="mt-0.5 block font-sans text-[12.5px] font-bold text-viaje-ink">{item.country}</b>
        </div>
        <div className="flex items-end">
          <CalendarDays className="h-4 w-4 text-viaje-red" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-viaje-line bg-viaje-paperAlt px-5 py-4">
        <p className="font-serif text-[16.5px] font-semibold text-viaje-red">
          {formatPeso(item.price)}
          <small className="ml-1 font-sans text-[11px] font-medium text-viaje-soft">/ person</small>
        </p>
        <Link href={`/packages/${item.slug}`}>
          <Button size="sm">View Package</Button>
        </Link>
      </div>
    </article>
  );
}
