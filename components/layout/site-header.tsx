import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/packages", label: "Packages" },
  { href: "/customize-my-trip", label: "Custom Trip" },
  { href: "/flights", label: "Flights" }
] satisfies Array<{ href: Route; label: string }>;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-viaje-line bg-viaje-paper/90 backdrop-blur">
      <div className="container-page flex h-[67px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-serif text-xl font-semibold text-viaje-navy">
          <span className="relative flex h-[34px] w-[34px] items-center justify-center rounded-full bg-gradient-to-br from-viaje-navy2 to-viaje-navy text-[15px] text-viaje-red2 after:rotate-[35deg] after:content-['✈']" />
          <span>Viaje Travel and Tours</span>
        </Link>
        <nav className="hidden items-center gap-[34px] text-[14.5px] font-semibold md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-viaje-ink/75 hover:text-viaje-red">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/packages">
            <Button size="sm">Book Now</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
