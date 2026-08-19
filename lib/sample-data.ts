import type { Booking, Departure, Payment, Quotation, TravelPackage } from "@/lib/types";

export const packages: TravelPackage[] = [
  {
    id: "pkg-japan-autumn",
    slug: "japan-autumn-discovery",
    title: "Japan Autumn Discovery",
    destination: "Tokyo, Mt. Fuji, Osaka",
    country: "Japan",
    type: "international",
    duration: "6D5N",
    description: "A guided Japan group departure with city highlights, Mt. Fuji views, shopping time, and visa document support.",
    coverImageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
    galleryUrls: [
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80"
    ],
    status: "published",
    pricing: { adult: 68900, childWithBed: 65900, childWithoutBed: 59900, infant: 12500, singleSupplement: 18000 },
    inclusions: ["Roundtrip airfare", "Hotel accommodation", "Daily breakfast", "Guided tours", "Visa assistance"],
    exclusions: ["Travel tax", "Visa fee", "Meals not mentioned", "Personal expenses"],
    requirements: ["Valid passport", "Japan visa documents", "Completed booking form"],
    brochureUrl: "brochures/japan-autumn.pdf",
    addons: [
      { id: "insurance", label: "Travel insurance", price: 1800 },
      { id: "baggage", label: "Extra 20kg baggage", price: 4200 }
    ]
  },
  {
    id: "pkg-palawan-escape",
    slug: "palawan-island-escape",
    title: "Palawan Island Escape",
    destination: "Puerto Princesa and El Nido",
    country: "Philippines",
    type: "domestic",
    duration: "4D3N",
    description: "A relaxed Palawan itinerary covering island hopping, underground river options, and private transfers.",
    coverImageUrl: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80",
    galleryUrls: [
      "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540202404-a2f29016b523?auto=format&fit=crop&w=1200&q=80"
    ],
    status: "published",
    pricing: { adult: 18900, childWithBed: 16900, childWithoutBed: 13900, infant: 2500, singleSupplement: 6500 },
    inclusions: ["Hotel accommodation", "Airport transfers", "Island hopping tour", "Daily breakfast"],
    exclusions: ["Airfare", "Environmental fees", "Optional tours"],
    requirements: ["Valid government ID", "Completed booking form"],
    addons: [
      { id: "underground-river", label: "Underground River tour", price: 3200 },
      { id: "private-van", label: "Private van upgrade", price: 4500 }
    ]
  },
  {
    id: "pkg-korea-winter",
    slug: "korea-winter-snow",
    title: "Korea Winter Snow",
    destination: "Seoul and Nami Island",
    country: "South Korea",
    type: "international",
    duration: "5D4N",
    description: "A winter-focused Korea tour with snow park activities, Seoul landmarks, and K-culture shopping stops.",
    coverImageUrl: "https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=1200&q=80",
    galleryUrls: ["https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=1200&q=80"],
    status: "published",
    pricing: { adult: 45900, childWithBed: 43900, childWithoutBed: 39900, infant: 9500, singleSupplement: 14000 },
    inclusions: ["Roundtrip airfare", "Hotel accommodation", "Tours and transfers", "Daily breakfast"],
    exclusions: ["K-ETA or visa fee", "Travel tax", "Lunch and dinner unless stated"],
    requirements: ["Valid passport", "Financial documents when required"],
    addons: [{ id: "ski-gear", label: "Ski gear rental", price: 2800 }]
  }
];

export const departures: Departure[] = [
  { id: "dep-jp-oct", packageId: "pkg-japan-autumn", startDate: "2026-10-18", endDate: "2026-10-23", slots: 12, basePrice: 68900, surcharge: 3000, availabilityStatus: "limited" },
  { id: "dep-jp-nov", packageId: "pkg-japan-autumn", startDate: "2026-11-08", endDate: "2026-11-13", slots: 18, basePrice: 68900, surcharge: 0, availabilityStatus: "available" },
  { id: "dep-pal-sep", packageId: "pkg-palawan-escape", startDate: "2026-09-12", endDate: "2026-09-15", slots: 20, basePrice: 18900, surcharge: 0, availabilityStatus: "available" },
  { id: "dep-kr-dec", packageId: "pkg-korea-winter", startDate: "2026-12-03", endDate: "2026-12-07", slots: 8, basePrice: 45900, surcharge: 2500, availabilityStatus: "limited" }
];

export const bookings: Booking[] = [
  { id: "booking-001", reference: "VJ-2026-0001", clientId: "client-001", packageId: "pkg-japan-autumn", departureId: "dep-jp-oct", status: "awaiting_payment", paymentStatus: "submitted", totalAmount: 137800, amountPaid: 30000, balance: 107800, source: "website", createdAt: "2026-08-10" },
  { id: "booking-002", reference: "VJ-2026-0002", clientId: "client-001", packageId: "pkg-palawan-escape", departureId: "dep-pal-sep", status: "confirmed", paymentStatus: "paid", totalAmount: 37800, amountPaid: 37800, balance: 0, source: "admin", createdAt: "2026-08-01" }
];

export const payments: Payment[] = [
  { id: "pay-001", transactionId: "txn-001", bookingId: "booking-001", clientId: "client-001", method: "gcash", referenceNumber: "GC-938201", amountExpected: 30000, amountSubmitted: 30000, paymentDate: "2026-08-12", status: "for_verification" }
];

export const quotations: Quotation[] = [
  {
    id: "quote-001",
    quotationNumber: "QT-2026-0942",
    clientId: "client-001",
    packageId: "pkg-japan-autumn",
    lineItems: [
      { label: "Japan Autumn Discovery - Adult", qty: 2, unitPrice: 68900, amount: 137800 },
      { label: "Travel insurance", qty: 2, unitPrice: 1800, amount: 3600 }
    ],
    subtotal: 141400,
    discount: 2000,
    total: 139400,
    validUntil: "2026-08-30",
    paymentTerms: "30% deposit within 3 banking days; balance 30 days before departure.",
    status: "sent"
  }
];

export function getPackage(packageId: string) {
  return packages.find((item) => item.id === packageId || item.slug === packageId) ?? packages[0];
}

export function getDepartures(packageId: string) {
  return departures.filter((departure) => departure.packageId === packageId);
}
