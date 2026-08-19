import Link from "next/link";
import { Anchor, BadgeCheck, Building, Building2, Bus, CalendarCheck, Car, Facebook, FileCheck, FileText, Globe2, Hotel, IdCard, Landmark, LogIn, Map, MapPin, MapPinned, Phone, Plane, PlaneTakeoff, ReceiptText, Route, ShieldCheck, Ship, Sparkles } from "lucide-react";
import { HeroPackageCarousel } from "@/components/domain/hero-package-carousel";
import { PackageCard } from "@/components/domain/package-card";
import { ProofTransactionsCarousel } from "@/components/domain/proof-transactions-carousel";
import { RecentActivitiesCarousel } from "@/components/domain/recent-activities-carousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { packages } from "@/lib/sample-data";

const services = [
  {
    title: "Ticketing",
    icon: PlaneTakeoff,
    items: [
      { label: "Domestic & Int'l Airline Tickets", icon: Plane },
      { label: "Boat Tickets", icon: Ship },
      { label: "Land Fares", icon: Bus },
      { label: "Taxes and Fees", icon: ReceiptText },
      { label: "Ferry Tickets", icon: Anchor }
    ]
  },
  {
    title: "Tour Packages",
    icon: Map,
    items: [
      { label: "Hotel Accommodation", icon: Hotel },
      { label: "Land and Sea Transfers", icon: Route },
      { label: "Tour Itinerary with Activities", icon: CalendarCheck },
      { label: "Licensed Tour Guide", icon: BadgeCheck }
    ]
  },
  {
    title: "Travel Services",
    icon: ShieldCheck,
    items: [
      { label: "Domestic Packages", icon: MapPinned },
      { label: "International Packages", icon: Globe2 },
      { label: "Visa Assistance", icon: FileCheck },
      { label: "Passport Assistance", icon: IdCard },
      { label: "PSA Assistance (Birth, Death, Cenomar, Marriage)", icon: FileText },
      { label: "Car Rentals", icon: Car },
      { label: "Bus Rentals", icon: Bus },
      { label: "Hotel Bookings", icon: Building },
      { label: "Land Arrangement", icon: Landmark },
      { label: "Land And Sea Transfer", icon: Route },
      { label: "And many more!", icon: Sparkles }
    ]
  }
];

const clients = [
  "Corporate Client",
  "Family Group",
  "School Tour",
  "Incentive Travel",
  "Private Group",
  "Community Partner"
];

const recentActivities = [
  {
    title: "Japan Autumn group departure",
    copy: "Coordinated guest bookings, payment submissions, and visa document support for an upcoming Japan tour.",
    date: "October 2026",
    location: "Japan",
    gallery: [
      { alt: "Japan group departure cover placeholder" },
      { alt: "Japan guest briefing placeholder" },
      { alt: "Japan travel documents placeholder" },
      { alt: "Japan itinerary placeholder" }
    ]
  },
  {
    title: "Palawan island escape inquiries",
    copy: "Prepared package options for families and private groups planning domestic island holidays.",
    date: "September 2026",
    location: "Palawan",
    gallery: [
      { alt: "Palawan island package placeholder" },
      { alt: "Palawan family inquiry placeholder" },
      { alt: "Palawan tour planning placeholder" },
      { alt: "Palawan itinerary placeholder" }
    ]
  },
  {
    title: "Corporate travel assistance",
    copy: "Supported route planning, ticketing, and travel requirements for business travelers.",
    date: "August 2026",
    location: "Laguna",
    gallery: [
      { alt: "Corporate travel assistance placeholder" },
      { alt: "Business route planning placeholder" },
      { alt: "Ticketing coordination placeholder" },
      { alt: "Travel requirements placeholder" }
    ]
  }
];

const proofCategories = [
  {
    title: "Visa Approval",
    copy: "Sample approved visa transaction posts and client proof materials.",
    images: [
      { src: "/proofs/visa-approval-01.png", alt: "Japan visa approval transaction proof" },
      { src: "/proofs/visa-approval-02.png", alt: "USA visa approval transaction proof" },
      { src: "/proofs/visa-approval-03.png", alt: "Japan visa approval transaction proof" }
    ]
  },
  {
    title: "Hotel Bookings",
    copy: "Sample hotel booking confirmations arranged by Viaje Travel and Tours.",
    images: [
      { src: "/proofs/hotel-booking-01.png", alt: "Hotel booking confirmation proof" },
      { src: "/proofs/hotel-booking-02.png", alt: "Hotel booking voucher proof" }
    ]
  },
  {
    title: "Flight Bookings",
    copy: "Sample issued flight tickets and itinerary receipts.",
    images: [
      { src: "/proofs/flight-booking-01.png", alt: "AirAsia flight booking proof" },
      { src: "/proofs/flight-booking-02.png", alt: "Cebu Pacific flight booking proof" }
    ]
  }
];

const phoneDisplay = "0915 837 5470";
const phoneHref = "tel:+639158375470";
const facebookUrl = "https://www.facebook.com/viajewithus/";
const address = "2/F Lifestyle Plaza Building P. Guevarra Ave, Barangay 3, Sta Cruz, Laguna (above Figaro Coffee Shop)";
const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[linear-gradient(333deg,#faf9f5_0%,#89000012_48%,#ffffff_100%)] text-viaje-navy lg:min-h-[100svh]">
        <div className="container-page relative grid min-h-[680px] items-center gap-10 py-16 text-center lg:min-h-[100svh] lg:grid-cols-[0.95fr_1.05fr] lg:text-left">
          <div className="space-y-7">
            <img src="/brand/viaje-logo.png" alt="Viaje Travel and Tours" className="mx-auto h-auto w-56 sm:w-64 lg:mx-0" />
            <h1 className="mx-auto max-w-xl text-4xl font-medium leading-[1.05] sm:text-[52px] lg:mx-0">We make the plan, <em className="font-medium italic text-viaje-red">you pack your bags.</em></h1>
            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href="/packages"><Button>Explore Packages</Button></Link>
              <a href={phoneHref}><Button variant="outline"><Phone className="h-4 w-4" />Call</Button></a>
              <Link href="/login"><Button variant="outline"><LogIn className="h-4 w-4" />Login</Button></Link>
            </div>
          </div>
          <div className="min-w-0">
            <HeroPackageCarousel items={packages} />
          </div>
        </div>
      </section>

      <section className="container-page py-24">
        <div className="mb-10">
          <p className="eyebrow">Services</p>
          <h2 className="mt-3 text-4xl font-medium text-viaje-navy">Travel support for every step.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <Card key={service.title}>
              <CardHeader>
                <service.icon className="h-7 w-7 text-viaje-red" />
                <CardTitle>{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                  {service.items.map((item) => (
                    <li key={item.label} className="flex items-start gap-2.5">
                      <item.icon className="mt-1 h-4 w-4 shrink-0 text-viaje-red" />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-viaje-paper py-24">
        <div className="container-page">
          <div className="mb-10 max-w-3xl">
            <div>
              <p className="eyebrow">About Us</p>
              <h2 className="mt-3 text-4xl font-medium text-viaje-navy">Your local travel partner in Sta. Cruz, Laguna.</h2>
            </div>
            <p className="mt-5 text-[16px] leading-7 text-viaje-soft">Viaje Travel and Tours helps travelers plan smoother trips through ticketing, tour packages, travel documentation support, and practical pre-departure coordination.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
            <img src="/brand/viaje-office.jpg" alt="Viaje Travel and Tours office" className="h-full min-h-[420px] w-full rounded-[8px] object-cover shadow-[0_24px_60px_-42px_rgba(15,36,56,0.42)]" />
            <Card>
              <CardContent className="grid h-full content-center gap-5 p-6">
                <a href={phoneHref} className="flex items-center gap-4 rounded-[8px] border border-viaje-line p-4 transition hover:bg-viaje-paper">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-viaje-red text-white">
                    <Phone className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-viaje-soft">Contact Number</span>
                    <span className="mt-1 block font-serif text-xl font-semibold text-viaje-navy">{phoneDisplay}</span>
                  </span>
                </a>
                <a href={facebookUrl} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-[8px] border border-viaje-line p-4 transition hover:bg-viaje-paper">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-viaje-red text-white">
                    <Facebook className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-viaje-soft">Facebook</span>
                    <span className="mt-1 block font-serif text-xl font-semibold text-viaje-navy">Viaje Travel and Tours</span>
                  </span>
                </a>
                <div className="rounded-[8px] border border-viaje-line p-4">
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-viaje-red text-white">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-viaje-soft">Direction</span>
                      <span className="mt-1 block text-sm leading-6 text-viaje-ink">{address}</span>
                    </span>
                  </div>
                  <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex">
                    <Button>
                      <MapPin className="h-4 w-4" />
                      Open Google Maps
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container-page py-24">
        <div className="mb-8">
          <p className="eyebrow">Accreditation</p>
          <h2 className="mt-3 text-3xl font-medium text-viaje-navy">Recognized travel standards.</h2>
        </div>
        <div className="flex flex-wrap gap-4">
          <Card className="rounded-[8px]">
            <CardContent className="flex items-center gap-4 p-4">
              <img src="/brand/dot-logo.webp" alt="Department of Tourism Philippines" className="h-16 w-16 object-contain" />
              <div>
                <h3 className="font-serif text-lg font-semibold text-viaje-navy">Department of Tourism</h3>
                <p className="mt-1 text-xs text-viaje-soft">Philippines accreditation reference</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[8px]">
            <CardContent className="flex items-center gap-4 p-4">
              <img src="/brand/iso-9001-2015.webp" alt="ISO 9001:2015" className="h-16 w-20 object-contain" />
              <div>
                <h3 className="font-serif text-lg font-semibold text-viaje-navy">ISO 9001:2015</h3>
                <p className="mt-1 text-xs text-viaje-soft">Quality management standard reference</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-viaje-paperAlt py-24">
        <div className="container-page">
          <div className="mb-10">
            <div>
              <p className="eyebrow">Our Clients</p>
              <h2 className="mt-3 text-4xl font-medium text-viaje-navy">Trusted by travelers and groups.</h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Card key={client}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-viaje-navy text-white">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-viaje-soft">Client Logo</p>
                    <h3 className="mt-1 font-serif text-xl font-semibold text-viaje-navy">{client}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-24">
        <div className="mb-10">
          <p className="eyebrow">Recent Activities</p>
          <h2 className="mt-3 text-4xl font-medium text-viaje-navy">Recent client trips, approvals, and travel support.</h2>
          <p className="mt-5 max-w-3xl text-[16px] leading-7 text-viaje-soft">A running snapshot of the latest arrangements, inquiries, and coordination work completed by Viaje Travel and Tours.</p>
        </div>
        <RecentActivitiesCarousel activities={recentActivities} />
      </section>

      <section className="bg-white py-24">
        <div className="container-page">
          <div className="mb-10 max-w-3xl">
            <p className="eyebrow">Proof of Transactions</p>
            <h2 className="mt-3 text-4xl font-medium text-viaje-navy">Sample successful arrangements.</h2>
            <p className="mt-5 text-[16px] leading-7 text-viaje-soft">Sample documents showing completed visa approvals, hotel confirmations, and issued flight bookings handled by Viaje Travel and Tours.</p>
          </div>
          <ProofTransactionsCarousel categories={proofCategories} />
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
    </main>
  );
}
