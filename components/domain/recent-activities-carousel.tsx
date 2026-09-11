"use client";

import { useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, ImageIcon, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface RecentActivityItem {
  title: string;
  copy: string;
  date: string;
  location: string;
  coverImageUrl?: string;
  gallery: Array<{ src?: string; alt: string }>;
}

function ActivityPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[180px] w-full items-center justify-center bg-[linear-gradient(135deg,#f1ece1_0%,#faf9f6_48%,#ead8d4_100%)] text-viaje-soft">
      <div className="text-center">
        <ImageIcon className="mx-auto h-8 w-8 text-viaje-red" />
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em]">{label}</p>
      </div>
    </div>
  );
}

export function RecentActivitiesCarousel({ activities }: { activities: RecentActivityItem[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<RecentActivityItem | null>(null);

  function scrollByCard(direction: "left" | "right") {
    scrollerRef.current?.scrollBy({
      left: direction === "left" ? -360 : 360,
      behavior: "smooth"
    });
  }

  return (
    <>
      <div className="mb-5 flex justify-end gap-2">
        <Button type="button" variant="outline" size="icon" onClick={() => scrollByCard("left")} aria-label="Previous activities">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={() => scrollByCard("right")} aria-label="Next activities">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div ref={scrollerRef} className="flex snap-x gap-5 overflow-x-auto pb-4 [scrollbar-width:thin]">
        {activities.map((activity) => (
          <article key={activity.title} className="min-w-[300px] snap-start overflow-hidden rounded-[8px] border border-viaje-line bg-white shadow-[0_20px_44px_-34px_rgba(15,36,56,0.45)] sm:min-w-[360px]">
            <div className="h-48 overflow-hidden">
              {activity.coverImageUrl ? (
                <img src={activity.coverImageUrl} alt={activity.title} className="h-full w-full object-cover" />
              ) : (
                <ActivityPlaceholder label="Cover photo" />
              )}
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-3 text-xs text-viaje-soft">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-viaje-red" />{activity.date}</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-viaje-red" />{activity.location}</span>
              </div>
              <h3 className="mt-3 font-serif text-2xl font-semibold leading-tight text-viaje-navy">{activity.title}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-viaje-soft">{activity.copy}</p>
              <Button type="button" className="mt-5" onClick={() => setSelected(activity)}>
                View Activity
              </Button>
            </div>
          </article>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-viaje-navy/90 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[8px] bg-white shadow-[0_28px_80px_-30px_rgba(0,0,0,0.65)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-viaje-line bg-white px-5 py-4">
              <div>
                <p className="eyebrow">Activity</p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-viaje-navy">{selected.title}</h2>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => setSelected(null)} aria-label="Close activity">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-6 p-5">
              <div>
                <div className="rounded-[8px] border border-viaje-line bg-viaje-paper p-4">
                  <div className="flex flex-wrap gap-3 text-xs text-viaje-soft">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-viaje-red" />{selected.date}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-viaje-red" />{selected.location}</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-viaje-ink">{selected.copy}</p>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-viaje-soft">Gallery</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {selected.gallery.map((image, index) => (
                    <div key={`${selected.title}-${index}`} className="flex aspect-square items-center justify-center overflow-hidden rounded-[8px] border border-viaje-line bg-viaje-paper p-2">
                      {image.src ? (
                        <img src={image.src} alt={image.alt} className="max-h-full w-full object-contain" />
                      ) : (
                        <ActivityPlaceholder label={`Photo ${index + 1}`} />
                      )}
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
