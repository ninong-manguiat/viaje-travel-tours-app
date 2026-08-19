"use client";

import { useRef, useState } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ProofTransactionCategory {
  title: string;
  copy: string;
  images: Array<{ src: string; alt: string }>;
}

export function ProofTransactionsCarousel({ categories }: { categories: ProofTransactionCategory[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<ProofTransactionCategory | null>(null);

  function scrollByCard(direction: "left" | "right") {
    scrollerRef.current?.scrollBy({
      left: direction === "left" ? -380 : 380,
      behavior: "smooth"
    });
  }

  return (
    <>
      <div className="mb-5 flex justify-end gap-2">
        <Button type="button" variant="outline" size="icon" onClick={() => scrollByCard("left")} aria-label="Previous transaction proofs">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={() => scrollByCard("right")} aria-label="Next transaction proofs">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div ref={scrollerRef} className="flex snap-x gap-5 overflow-x-auto pb-4 [scrollbar-width:thin]">
        {categories.map((category) => (
          <article key={category.title} className="min-w-[300px] snap-start overflow-hidden rounded-[8px] border border-viaje-line bg-white shadow-[0_20px_44px_-34px_rgba(15,36,56,0.45)] sm:min-w-[380px]">
            <div className="flex h-64 items-center justify-center bg-viaje-paper p-3">
              <img src={category.images[0].src} alt={category.images[0].alt} className="max-h-full w-full object-contain" />
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-3 text-xs text-viaje-soft">
                <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-viaje-red" />Verified sample</span>
                <span className="inline-flex items-center gap-1.5"><Images className="h-3.5 w-3.5 text-viaje-red" />{category.images.length} photos</span>
              </div>
              <h3 className="mt-3 font-serif text-2xl font-semibold leading-tight text-viaje-navy">{category.title}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-viaje-soft">{category.copy}</p>
              <Button type="button" className="mt-5" onClick={() => setSelected(category)}>
                View Proofs
              </Button>
            </div>
          </article>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-viaje-navy/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[8px] bg-white shadow-[0_28px_80px_-30px_rgba(0,0,0,0.65)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-viaje-line bg-white px-5 py-4">
              <div>
                <p className="eyebrow">Proof of Transactions</p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-viaje-navy">{selected.title}</h2>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => setSelected(null)} aria-label="Close proofs">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-6 p-5">
              <div className="rounded-[8px] border border-viaje-line bg-viaje-paper p-4">
                <div className="flex flex-wrap gap-3 text-xs text-viaje-soft">
                  <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-viaje-red" />Verified sample</span>
                  <span className="inline-flex items-center gap-1.5"><Images className="h-3.5 w-3.5 text-viaje-red" />{selected.images.length} photos</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-viaje-ink">{selected.copy}</p>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-viaje-soft">Gallery</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selected.images.map((image) => (
                    <div key={image.src} className="flex h-72 items-center justify-center overflow-hidden rounded-[8px] border border-viaje-line bg-viaje-paper p-3">
                      <img src={image.src} alt={image.alt} className="max-h-full w-full object-contain" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
