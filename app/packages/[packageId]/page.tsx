import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Check, Hotel, Phone, Plane, X } from "lucide-react";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDepartures, getPackage } from "@/lib/sample-data";
import { formatDate, formatPeso } from "@/lib/utils";

export default function PackageDetailsPage({ params }: { params: { packageId: string } }) {
  const pkg = getPackage(params.packageId);
  const deps = getDepartures(pkg.id);
  const selected = deps[0];

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
          <div className="grid gap-8 py-12 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <Link href="/packages" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white/78 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Back to packages
              </Link>
              <p className="eyebrow text-viaje-gold">{pkg.destination}</p>
              <h1 className="mt-3 text-[clamp(2.55rem,5vw,4.8rem)] leading-[0.95]">{pkg.title}</h1>
              <p className="mt-5 max-w-2xl text-[17px] leading-7 text-white/76">{pkg.description}</p>
            </div>
            <img src={pkg.coverImageUrl} alt={pkg.title} className="h-[280px] w-full rounded-lg object-cover shadow-[0_24px_60px_-34px_rgba(0,0,0,0.65)]" />
          </div>
        </div>
      </section>

      <section className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-lg"><CardContent className="flex items-center gap-3 p-5"><Calendar className="h-5 w-5 text-viaje-red" />{pkg.duration}</CardContent></Card>
            <Card className="rounded-lg"><CardContent className="flex items-center gap-3 p-5"><Plane className="h-5 w-5 text-viaje-red" />Cebu Pacific style routing</CardContent></Card>
            <Card className="rounded-lg"><CardContent className="flex items-center gap-3 p-5"><Hotel className="h-5 w-5 text-viaje-red" />3-4 star hotels</CardContent></Card>
          </div>
          <section>
            <h2 className="mb-4 text-2xl font-bold text-viaje-navy">Departure Dates</h2>
            <div className="grid gap-3">
              {deps.map((dep) => (
                <Card key={dep.id} className="rounded-lg">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold">{formatDate(dep.startDate)} - {formatDate(dep.endDate)}</p>
                      <p className="text-sm text-muted-foreground">Additional amount {formatPeso(dep.basePrice - pkg.price)}</p>
                    </div>
                    <StatusBadge status={dep.availabilityStatus} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
          <section className="grid gap-5 md:grid-cols-2">
            <Card className="rounded-lg">
              <CardHeader><CardTitle>Inclusions</CardTitle></CardHeader>
              <CardContent className="space-y-2">{pkg.inclusions.map((item) => <p key={item} className="flex gap-2"><Check className="h-5 w-5 text-emerald-600" />{item}</p>)}</CardContent>
            </Card>
            <Card className="rounded-lg">
              <CardHeader><CardTitle>Exclusions</CardTitle></CardHeader>
              <CardContent className="space-y-2">{pkg.exclusions.map((item) => <p key={item} className="flex gap-2"><X className="h-5 w-5 text-viaje-red" />{item}</p>)}</CardContent>
            </Card>
          </section>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between"><span>Package price</span><strong>{formatPeso(pkg.price)}</strong></div>
              <div className="flex justify-between"><span>Selected departure</span><span>{selected ? formatDate(selected.startDate) : "TBD"}</span></div>
              <div className="flex justify-between"><span>Additional amount</span><strong>{formatPeso(selected ? selected.basePrice - pkg.price : 0)}</strong></div>
              <Link href={`/book/${pkg.id}?departureId=${selected?.id ?? ""}`}><Button className="w-full">Book This Package</Button></Link>
              <Button variant="outline" className="w-full">Download Brochure</Button>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}
