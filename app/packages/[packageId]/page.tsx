import Link from "next/link";
import { Calendar, Check, Hotel, Plane, X } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
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
    <>
      <SiteHeader />
      <main className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <img src={pkg.coverImageUrl} alt={pkg.title} className="h-[430px] w-full rounded-lg object-cover" />
          <div>
            <p className="font-semibold text-viaje-red">{pkg.destination}</p>
            <h1 className="mt-2 text-4xl font-bold text-viaje-navy">{pkg.title}</h1>
            <p className="mt-4 text-muted-foreground">{pkg.description}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardContent className="flex items-center gap-3 p-5"><Calendar className="h-5 w-5 text-viaje-red" />{pkg.duration}</CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 p-5"><Plane className="h-5 w-5 text-viaje-red" />Cebu Pacific style routing</CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 p-5"><Hotel className="h-5 w-5 text-viaje-red" />3-4 star hotels</CardContent></Card>
          </div>
          <section>
            <h2 className="mb-4 text-2xl font-bold text-viaje-navy">Departure Dates</h2>
            <div className="grid gap-3">
              {deps.map((dep) => (
                <Card key={dep.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold">{formatDate(dep.startDate)} - {formatDate(dep.endDate)}</p>
                      <p className="text-sm text-muted-foreground">{dep.slots} slots left · Surcharge {formatPeso(dep.surcharge)}</p>
                    </div>
                    <StatusBadge status={dep.availabilityStatus} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
          <section className="grid gap-5 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Inclusions</CardTitle></CardHeader>
              <CardContent className="space-y-2">{pkg.inclusions.map((item) => <p key={item} className="flex gap-2"><Check className="h-5 w-5 text-emerald-600" />{item}</p>)}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Exclusions</CardTitle></CardHeader>
              <CardContent className="space-y-2">{pkg.exclusions.map((item) => <p key={item} className="flex gap-2"><X className="h-5 w-5 text-red-600" />{item}</p>)}</CardContent>
            </Card>
          </section>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between"><span>Adult price</span><strong>{formatPeso(pkg.pricing.adult)}</strong></div>
              <div className="flex justify-between"><span>Selected departure</span><span>{selected ? formatDate(selected.startDate) : "TBD"}</span></div>
              <div className="flex justify-between"><span>Surcharge</span><strong>{formatPeso(selected?.surcharge ?? 0)}</strong></div>
              <Link href={`/book/${pkg.id}?departureId=${selected?.id ?? ""}`}><Button className="w-full">Book This Package</Button></Link>
              <Button variant="outline" className="w-full">Download Brochure</Button>
            </CardContent>
          </Card>
        </aside>
      </main>
    </>
  );
}
