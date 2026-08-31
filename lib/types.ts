export type Role = "guest" | "client" | "admin";
export type BookingStatus = "inquiry" | "quotation_sent" | "reserved" | "awaiting_payment" | "confirmed" | "processing" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "submitted" | "for_verification" | "partially_paid" | "paid" | "rejected" | "refunded";
export type DocumentStatus = "required" | "submitted" | "under_review" | "approved" | "needs_replacement";
export type QuotationStatus = "draft" | "sent" | "viewed" | "accepted" | "expired" | "converted";
export type PackageStatus = "published" | "draft" | "archived";

export interface UserProfile {
  id: string;
  role: "client" | "admin";
  fullName: string;
  email: string;
  mobile?: string;
  accountStatus: "pending" | "active";
  createdAt: string;
}

export interface TravelPackage {
  id: string;
  slug: string;
  title: string;
  destination: string;
  country: string;
  type: "domestic" | "international";
  duration: string;
  airline?: string;
  hotel?: string;
  description: string;
  coverImageUrl: string;
  galleryUrls: string[];
  status: PackageStatus;
  price: number;
  travelDates: Array<{
    id: string;
    startDate: string;
    endDate: string;
    additionalAmount: number;
    availabilityStatus: "available" | "limited" | "sold_out";
  }>;
  itinerary: Array<{
    day: string;
    name?: string;
    icon?: string;
    imageUrl: string;
    activities: Array<{ activity: string; icon: string }>;
  }>;
  inclusions: string[];
  exclusions: string[];
  requirements: string[];
  brochureUrl?: string;
  addons: Array<{ id: string; label: string; price: number }>;
}

export interface Departure {
  id: string;
  packageId: string;
  startDate: string;
  endDate: string;
  slots: number;
  basePrice: number;
  availabilityStatus: "available" | "limited" | "sold_out";
}

export interface Booking {
  id: string;
  reference: string;
  clientId: string | null;
  packageId: string;
  departureId?: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  source: "website" | "admin";
  createdAt: string;
}

export interface Transaction {
  id: string;
  bookingId: string;
  clientId?: string;
  type: "full" | "deposit" | "partial";
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  transactionId: string;
  bookingId: string;
  clientId?: string;
  method: "gcash" | "maya" | "bank";
  referenceNumber: string;
  amountExpected: number;
  amountSubmitted: number;
  receiptUrl?: string;
  paymentDate: string;
  notes?: string;
  status: PaymentStatus;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  clientId: string;
  bookingId?: string;
  packageId?: string;
  lineItems: Array<{ label: string; qty: number; unitPrice: number; amount: number }>;
  subtotal: number;
  discount: number;
  total: number;
  validUntil: string;
  paymentTerms: string;
  status: QuotationStatus;
  pdfUrl?: string;
}
