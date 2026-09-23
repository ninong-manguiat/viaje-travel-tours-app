"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BusinessLegitimacyDocument {
  name: string;
  fileUrl: string;
}

function isImageFile(url: string) {
  return /\.(jpe?g|png|webp)$/i.test(url.split("?")[0] || "");
}

export function BusinessLegitimacyCarousel({ documents }: { documents: BusinessLegitimacyDocument[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: "left" | "right") {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({
      left: direction === "left" ? -scroller.clientWidth : scroller.clientWidth,
      behavior: "smooth"
    });
  }

  return (
    <>
      <div className="mb-5 flex justify-end gap-2">
        <Button type="button" variant="outline" size="icon" onClick={() => scrollByCard("left")} aria-label="Previous business legitimacy documents">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={() => scrollByCard("right")} aria-label="Next business legitimacy documents">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div ref={scrollerRef} className="overflow-hidden">
        <div className="flex snap-x gap-2 pb-1 lg:gap-5">
          {documents.map((document) => (
            <a
              key={`${document.name}-${document.fileUrl}`}
              href={document.fileUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${document.name}`}
              className="group flex-none basis-[calc((100%_-_1rem)/3)] snap-start overflow-hidden rounded-[8px] border border-viaje-line bg-white shadow-[0_20px_44px_-34px_rgba(15,36,56,0.45)] transition hover:-translate-y-0.5 lg:basis-[calc((100%_-_5rem)/5)]"
            >
              <div className="flex aspect-[3/4] items-center justify-center bg-viaje-paper p-1.5 sm:p-2 lg:p-3">
                {isImageFile(document.fileUrl) ? (
                  <img src={document.fileUrl} alt={document.name} className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-viaje-red">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                )}
              </div>
              <h3 className="flex min-h-[3.5rem] items-center justify-center px-2 py-2 text-center text-[11px] font-semibold leading-4 text-viaje-navy sm:text-sm lg:px-3 lg:py-3">
                <span className="line-clamp-2">
                  {document.name}
                </span>
              </h3>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
