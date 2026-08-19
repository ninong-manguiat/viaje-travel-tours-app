import Link from "next/link";
import { Award, BadgeCheck, Handshake, Map, PlaneTakeoff, ShieldCheck, Sparkles } from "lucide-react";
import { PackageCard } from "@/components/domain/package-card";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { packages } from "@/lib/sample-data";
import { formatPeso } from "@/lib/utils";

const services = [
  { title: "Ticketing", copy: "Domestic and international airfare support with practical routing advice.", icon: PlaneTakeoff },
  { title: "Tour Packages", copy: "Curated group departures, family holidays, incentive trips, and seasonal promos.", icon: Map },
  { title: "Travel Services", copy: "Visa assistance, insurance, transfers, documents, and pre-trip coordination.", icon: ShieldCheck }
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-viaje-navy via-viaje-navy2 to-viaje-navy3 pt-20 text-white before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_85%_20%,rgba(216,154,61,0.18),transparent_45%),radial-gradient(circle_at_10%_80%,rgba(196,58,46,0.22),transparent_40%)]">
          <div className="container-page relative grid min-h-[600px] items-center gap-10 pb-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-7">
              <p className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-viaje-gold before:h-1.5 before:w-1.5 before:rounded-full before:bg-viaje-gold before:content-['']">DOT-accredited travel planning</p>
              <h1 className="max-w-xl text-4xl font-medium leading-[1.05] sm:text-[52px]">We make the plan, <em className="font-medium italic text-viaje-gold">you pack your bags.</em></h1>
              <p className="max-w-lg text-[17px] leading-[1.65] text-white/70">Discover handpicked tours, guest-friendly booking, manual payment verification, and guided document support for your next trip.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/packages"><Button>Explore Packages</Button></Link>
                <Link href="/customize-my-trip"><Button variant="outline" className="border-white/55 text-white hover:bg-white/10">Customize My Trip</Button></Link>
              </div>
              <div className="grid max-w-xl grid-cols-3 gap-6 border-t border-white/15 pt-6">
                {[["24/7", "Trip support"], ["DOT", "Accredited"], ["100+", "Curated departures"]].map(([value, label]) => (
                  <div key={label}>
                    <b className="block font-serif text-2xl font-semibold">{value}</b>
                    <span className="text-xs text-white/60">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative hidden h-[520px] lg:block">
              {packages.map((pkg, index) => (
                <div
                  key={pkg.id}
                  className={[
                    "absolute w-[300px] overflow-hidden rounded-[14px] bg-white text-viaje-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)]",
                    index === 0 && "left-5 top-0 z-20 -rotate-6",
                    index === 1 && "left-[150px] top-[170px] z-30 rotate-3",
                    index === 2 && "left-0 top-[340px] z-10 -rotate-3 opacity-90"
                  ].filter(Boolean).join(" ")}
                >
                  <img src={pkg.coverImageUrl} alt="" className="h-[150px] w-full object-cover" />
                  <div className="p-4">
                    <div className="mb-1 flex justify-between font-mono text-[11px] text-viaje-soft">
                      <span>{pkg.country}</span>
                      <span>{pkg.duration}</span>
                    </div>
                    <h4 className="font-serif text-lg font-semibold">{pkg.title}</h4>
                    <p className="mt-2 font-mono text-[13px] font-medium text-viaje-red">{formatPeso(pkg.pricing.adult)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-viaje-line bg-white py-24">
          <div className="container-page">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="eyebrow">Discover Viaje</p>
              <h2 className="mt-3 text-4xl font-medium text-viaje-navy">Reliable travel support from inquiry to departure.</h2>
            </div>
            <p className="text-[17px] leading-[1.75] text-viaje-soft">Viaje Travel and Tours brings package discovery, guest checkout, manual QR payment submission, client dashboards, document checklists, quotations, and admin operations into one coordinated platform.</p>
          </div>
          </div>
        </section>

        <section className="bg-viaje-paper py-24">
          <div className="container-page">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Featured Packages</p>
                <h2 className="mt-3 text-4xl font-medium text-viaje-navy">Popular departures</h2>
              </div>
              <Link href="/packages"><Button variant="outline">View All</Button></Link>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {packages.map((item) => <PackageCard key={item.id} item={item} />)}
            </div>
          </div>
        </section>

        <section className="container-page grid gap-6 py-24 md:grid-cols-3">
          {services.map((service) => (
            <Card key={service.title}>
              <CardHeader>
                <service.icon className="h-7 w-7 text-viaje-red" />
                <CardTitle>{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{service.copy}</CardContent>
            </Card>
          ))}
        </section>

        <section className="bg-viaje-paperAlt py-16">
          <div className="container-page grid gap-4 md:grid-cols-4">
            {[
              ["V", "Value-driven journeys"],
              ["I", "Integrity in every quote"],
              ["A", "Assistance before and after booking"],
              ["J", "Joyful, memorable travel"],
              ["E", "Excellence in operations"]
            ].map(([letter, copy]) => (
              <div key={letter} className="rounded-[14px] bg-white p-5">
                <p className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-viaje-navy font-serif text-sm font-semibold text-viaje-gold">{letter}</p>
                <p className="mt-2 text-sm font-medium">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container-page py-20">
          <div className="grid gap-5 md:grid-cols-3">
            {[Award, BadgeCheck, Handshake, Sparkles].map((Icon, index) => (
              <Card key={index}>
                <CardContent className="flex items-center gap-3 p-5">
                  <Icon className="h-6 w-6 text-viaje-teal" />
                  <span className="font-semibold">{["DOT accredited", "ISO 9001:2015 oriented", "Corporate and family markets", "Custom trip planning"][index]}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
