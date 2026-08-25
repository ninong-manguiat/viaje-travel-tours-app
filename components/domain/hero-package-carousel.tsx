"use client";

import Link from "next/link";
import Marquee from "react-fast-marquee";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TravelPackage } from "@/lib/types";
import { formatPeso } from "@/lib/utils";

export function HeroPackageCarousel({ items }: { items: TravelPackage[] }) {
  return (
    <div className="relative overflow-hidden py-5">
      <Marquee autoFill pauseOnHover speed={34} gradient gradientColor="#f7fbff" gradientWidth={56}>
        {items.map((item) => (
          <article key={item.id} className="mx-3 w-[280px] overflow-hidden rounded-[8px] border border-viaje-line bg-white shadow-[0_18px_44px_-32px_rgba(15,36,56,0.55)]">
            <img src={item.coverImageUrl} alt={item.title} className="h-[158px] w-full object-cover" />
            <div className="p-4">
              <p className="flex items-center gap-1 text-[12.5px] text-viaje-soft">
                <MapPin className="h-4 w-4" />
                {item.destination}
              </p>
              <h3 className="mt-1 min-h-[52px] font-serif text-xl font-semibold leading-tight text-viaje-navy">{item.title}</h3>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="font-mono text-[12px] font-semibold text-viaje-red">{formatPeso(item.price)}</p>
                <Link href={`/packages/${item.slug}`}>
                  <Button size="sm" className="h-8 px-3 text-[11px]">
                    View
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </Marquee>
    </div>
  );
}
