# Viaje Travel and Tours — Functional Specification & AI Agent Build Prompts

**Stack**
- Framework: **Next.js** (App Router)
- UI: **Tailwind CSS + shadcn/ui**
- File / media storage: **Cloudflare** (R2 buckets)
- Auth + Database: **Firebase** (Firebase Authentication + Firestore)

This document has two parts:
1. **Functional Specification** — every module, its purpose, roles, pages, functionality, and data model.
2. **AI Agent Prompts** — one self-contained, copy-pasteable prompt per module for handing to your coding agent (Claude Code, Cursor, etc.). Each prompt repeats the stack context so it works standalone in a fresh agent session.

---

## 0. Global Foundations

These apply across every module and should be built first.

### Roles
- **Guest** — unauthenticated visitor
- **Client** — authenticated traveler/customer
- **Admin** — Viaje staff (single role for Phase 1; sub-roles like `staff` vs `manager` can be added later for discount authorization)

### Firestore Collections (top-level)
| Collection | Purpose |
|---|---|
| `users` | Auth profile + role (`client` \| `admin`), name, email, phone, accountStatus |
| `packages` | Tour packages, with subcollections `departures`, `flights`, `hotels`, `itineraryDays` |
| `bookings` | Client bookings, with subcollection `travelers` |
| `transactions` | Financial transactions tied to a booking |
| `payments` | Submitted proofs of payment tied to a transaction |
| `quotations` | Digital quotations, standalone or tied to a booking |
| `documentChecklists` | Per-booking document checklist, with subcollection `documents` |
| `secureLinks` | Single-use tokens for activation / payment / document-upload links sent to guests |
| `activityLog` | Audit trail: who did what, when, on which entity |
| `websiteContent` | Singleton doc(s) powering the CMS-editable homepage sections |

### Cloudflare R2 Buckets
| Bucket | Contents |
|---|---|
| `viaje-package-media` | Package cover images, gallery images, brochure PDFs |
| `viaje-payment-receipts` | Uploaded proof-of-payment screenshots/PDFs |
| `viaje-travel-documents` | Passports, PSA certificates, visa documents (sensitive — restricted access) |
| `viaje-generated-pdfs` | Generated quotation PDFs |
| `viaje-site-media` | CMS-managed homepage/gallery imagery |

### Shared Status Enums
- **Booking**: `inquiry` · `quotation_sent` · `reserved` · `awaiting_payment` · `confirmed` · `processing` · `completed` · `cancelled`
- **Payment**: `unpaid` · `submitted` · `for_verification` · `partially_paid` · `paid` · `rejected` · `refunded`
- **Document**: `required` · `submitted` · `under_review` · `approved` · `needs_replacement`
- **Quotation**: `draft` · `sent` · `viewed` · `accepted` · `expired` · `converted`

### Security Rules Baseline
- Clients can only read/write their own `bookings`, `transactions`, `payments`, `documentChecklists` (matched on `clientId == auth.uid`).
- Only `admin` role (custom claim) can write to `packages`, `websiteContent`, or change any status field.
- `viaje-travel-documents` R2 objects are served through a signed-URL Next.js API route — never public — checked against Firestore ownership before signing.
- `secureLinks` tokens are single-use and time-limited (7-day default), validated server-side before granting activation/upload access to a guest with no Firebase session yet.

---

## 1. Public Website — Marketing & Discovery

**Purpose:** Let visitors learn about Viaje and browse packages without an account.
**Roles:** Guest
**Routes:** `/`, `/packages`, `/packages/[slug]`

**Functionality**
- Home: hero, Discover Viaje, Core Values (VIAJE), Why Choose Us, Services (Ticketing / Tour Packages / Travel Services), DOT/ISO accreditation, previous clients, Our Market, Featured Packages (4–6 cards), Custom Trip CTA, gallery, contact/inquiry form.
- Package Listing: filters (domestic/international, destination, travel month, package type, duration, price range), search, sort, pagination.
- Package Details: image gallery, overview, selectable departure dates with surcharge pricing, flight info, hotel info, day-by-day itinerary, inclusions/exclusions, optional add-ons, important notes, brochure download, sticky booking card.

**Data model**
- `packages/{packageId}`: `title, destination, country, type(domestic|international), duration, description, coverImageUrl, galleryUrls[], status(published|draft|archived), pricing{adult, childWithBed, childWithoutBed, infant, singleSupplement}, inclusions[], exclusions[], requirements[], brochureUrl`
- `packages/{packageId}/departures/{departureId}`: `startDate, endDate, slots, basePrice, surcharge, availabilityStatus(available|limited|sold_out)`
- `packages/{packageId}/flights/{flightId}`: `airline, flightNumber, origin, destination, departureTime, arrivalTime`
- `packages/{packageId}/hotels/{hotelId}`: `name, category, roomInfo, notes, images[]`
- `packages/{packageId}/itineraryDays/{dayId}`: `dayNumber, title, description`
- `customRequests/{requestId}`: `destination, preferredDates, travelerCount, adults, children, travelType, servicesRequired[], budget, additionalRequirements, fullName, mobile, email, status(new|contacted|quoted), createdAt`
- `websiteContent/homepage`: singleton doc with editable hero copy, values, why-choose-us cards, services, accreditation, client logos, market tags, gallery images, contact info

---

## 2. Guest Booking & Manual Payment

**Purpose:** Let a guest book a package and pay without creating an account first.
**Roles:** Guest → becomes Client after invite
**Routes:** `/book/[packageId]`, `/book/[bookingId]/payment`

**Functionality**
- 5-step checkout: Package → Travelers → Add-ons → Review → Payment.
- Traveler count by type (adult, child w/ bed, child w/o bed, infant), traveler info collection (name, birthdate, email, mobile, nationality; passport only when required).
- Add-ons selection (baggage, transfers, optional tours, insurance) with live cost summary.
- On submission: creates a `bookings` doc with status `reserved`, generates a `secureLinks` activation token, and (in later phase) triggers an account-invite email.
- Manual Payment page: displays booking reference, amount due, due date; GCash/Maya/Bank QR display; proof-of-payment upload form (method, amount, reference #, date, file, notes) → creates a `payments` doc with status `submitted`.

**Data model**
- `bookings/{bookingId}`: `clientId(nullable until activated), packageId, departureId, status, totalAmount, amountPaid, balance, source(website|admin), createdAt`
- `bookings/{bookingId}/travelers/{travelerId}`: `fullName, birthdate, email, mobile, nationality, passportNumber, type(adult|child_bed|child_no_bed|infant), isLeadTraveler`
- `bookings/{bookingId}` also stores selected `addons[]` (id, label, price, qty)
- `transactions/{transactionId}`: `bookingId, type(full|deposit|partial), amount, dueDate, status`
- `payments/{paymentId}`: `transactionId, bookingId, method(gcash|maya|bank), referenceNumber, amountExpected, amountSubmitted, receiptUrl(Cloudflare), paymentDate, notes, status(submitted|for_verification|paid|rejected|partially_paid), verifiedBy, verifiedAt`
- `secureLinks/{token}`: `type(activation), bookingId, expiresAt, used(bool)`

---

## 3. Authentication & Account Activation

**Purpose:** Convert an invited guest into a logged-in Client, and handle standard login.
**Roles:** Guest → Client
**Routes:** `/login`, `/forgot-password`, `/activate/[token]`

**Functionality**
- Standard Firebase email/password login + forgot-password flow.
- Invited-customer activation: `secureLinks` token validated server-side → pre-fills email → customer sets password → Firebase user created/linked → `users` doc created with role `client` → token marked used → booking's `clientId` backfilled.
- Session timeout / expired-link messaging.

**Data model**
- `users/{uid}`: `role(client|admin), fullName, email, mobile, accountStatus(pending|active), createdAt`
- Firebase custom claim `role` set via a Cloud Function on user creation/activation, used by Firestore security rules and Next.js middleware for route protection.

---

## 4. Client Dashboard

**Purpose:** Give logged-in clients self-service visibility into their trips, payments, and documents.
**Roles:** Client
**Routes:** `/dashboard`, `/dashboard/bookings/[bookingId]`, `/dashboard/transactions`, `/dashboard/documents`, `/dashboard/quotations/[quotationId]`

**Functionality**
- Overview: upcoming trips count, outstanding balance, documents required, recent payments, upcoming-trip cards, quick actions (submit payment, upload documents, download quotation, contact Viaje), recent activity timeline.
- Booking Details: booking-pipeline progress bar (Quotation → Reserved → Payment → Documents → Confirmed → Travel), summary, payment history table, balance-due card, document-status card.
- Transactions & Payments: full ledger table (transaction #, booking, date, description, amount, paid, balance, status) with filters by payment type.
- Visa/Document Center: per-checklist document list with upload/replace/view/download actions, status chips, staff remarks.
- Digital Quotation (client view): read-only formatted quotation with Download PDF and Proceed to Booking actions.

**Data model** — reuses `bookings`, `transactions`, `payments`, `documentChecklists`, `quotations` from above, all queried filtered by `clientId == auth.uid`.
- `documentChecklists/{checklistId}`: `bookingId, clientId, title(e.g. "Japan Visa Application")`
- `documentChecklists/{checklistId}/documents/{docId}`: `label, fileUrl(Cloudflare, restricted), status, uploadedAt, staffRemarks`
- `quotations/{quotationId}`: `clientId, bookingId(nullable), packageId, lineItems[{label, qty, unitPrice, amount}], subtotal, discount, total, validUntil, paymentTerms, status, pdfUrl`

---

## 5. Admin — Operations Dashboard

**Purpose:** Give staff a daily operational snapshot.
**Roles:** Admin
**Routes:** `/admin`

**Functionality**
- KPI cards: new bookings, pending payments total, payments for verification count, upcoming departures.
- Recent transactions table, upcoming departures table.
- Payment verification queue (quick-approve entry point).
- New custom-trip inquiries list.
- Recent client activity feed (from `activityLog`).

**Data model** — aggregation queries (or a nightly Cloud Function that writes rollups to `stats/dashboard`) over `bookings`, `payments`, `customRequests`, `activityLog`.

---

## 6. Admin — Transactions & Bookings

**Purpose:** Staff-side creation and management of transactions and bookings from any inbound channel.
**Roles:** Admin
**Routes:** `/admin/transactions/new`, `/admin/bookings`, `/admin/bookings/[bookingId]`

**Functionality**
- Create Transaction wizard: source tag (phone/Messenger/walk-in/existing/corporate), select-or-create customer, select package or custom service, editable line items, discount + authorization note, internal notes, payment terms (full/deposit/partial) with due date, generate quotation, create transaction, then "Send to Customer" (emails secure activation + payment link).
- Booking Management: list + detail view; edit package/departure/travelers/services; change booking status (dropdown through the booking status enum); internal notes (staff-only, never visible to client); view payment history and documents inline; quick actions (send payment link, request document, send email).

**Data model** — reuses `bookings`, `transactions`, `quotations`. Adds:
- `bookings/{bookingId}.internalNotes[]`: `{authorId, text, createdAt}` (never exposed to client-facing queries/rules)
- `activityLog/{entryId}`: `entityType(booking|payment|document), entityId, actorId, action, timestamp`

---

## 7. Admin — Package Management

**Purpose:** Staff-side authoring of packages shown on the public site.
**Roles:** Admin
**Routes:** `/admin/packages`, `/admin/packages/[packageId]/edit`

**Functionality**
- Tabbed editor: Basic Info, Schedule (multiple departures with slots/base price/surcharge), Pricing (adult/child/infant/single supplement), Flight, Hotel, Itinerary (day-by-day editor), Conditions (inclusions/exclusions/requirements/terms), Promotional Material (brochure upload).
- Publish / unpublish / duplicate / archive actions.
- Cover image + gallery upload → Cloudflare R2, URLs saved back to the `packages` doc.

**Data model** — writes to `packages` and its subcollections as defined in Module 1.

---

## 8. Admin — Client Management

**Purpose:** 360° view of a client for staff.
**Roles:** Admin
**Routes:** `/admin/clients`, `/admin/clients/[clientId]`

**Functionality**
- Summary cards: total bookings, upcoming bookings, outstanding balance, documents pending.
- Tabs: Bookings, Transactions, Payments, Quotations, Documents, Activity.
- Actions: create booking, create transaction, request document, send login link, send payment link, send email.

**Data model** — aggregation of `bookings`, `transactions`, `payments`, `quotations`, `documentChecklists`, `activityLog`, all filtered by `clientId`.

---

## 9. Admin — Payment Verification

**Purpose:** Manual reconciliation queue for Phase 1's QR-payment workflow.
**Roles:** Admin
**Routes:** `/admin/payments/verification`

**Functionality**
- Queue of `payments` with status `for_verification`, each showing receipt thumbnail, customer, booking, expected vs. submitted amount, method, reference, date, notes.
- Actions: Approve (→ `paid`, updates transaction + booking balance, sends confirmation email, writes `activityLog` entry), Reject (→ `rejected`, prompts for reason), Mark Partial (→ `partially_paid`, recalculates balance), Request New Proof.

**Data model** — writes to `payments`, `transactions`, `bookings.amountPaid/balance`, `activityLog`.

---

## 10. Admin — Document Management

**Purpose:** Staff-side checklist assignment and review of client-submitted travel documents.
**Roles:** Admin
**Routes:** `/admin/documents`, `/admin/documents/[checklistId]`

**Functionality**
- Assign a new checklist to a client/booking (e.g. "Japan Visa Application").
- Per-document actions: view, approve, reject/request replacement, send reminder for missing docs.
- Internal (staff-only) notes per checklist.
- Progress indicator (submitted / total).

**Data model** — writes to `documentChecklists` and `documentChecklists/{id}/documents`.

---

## 11. Admin — Quotation Builder

**Purpose:** Build, price, and send formal quotations to clients.
**Roles:** Admin
**Routes:** `/admin/quotations/new`, `/admin/quotations/[quotationId]`

**Functionality**
- Client + package/service selection, expiration date, travel dates.
- Editable line items (item, qty, unit price → auto amount), discount, internal notes.
- Live total preview.
- Actions: Preview, Download PDF (generated server-side, stored in `viaje-generated-pdfs`), Email to Customer, Convert to Booking.

**Data model** — writes to `quotations`; "Convert to Booking" creates a `bookings` doc referencing the quotation.

---

## 12. Phase 2 (Future) — Automated Payment Gateway

**Purpose:** Concept only for Phase 1 — replaces manual QR verification with a real-time gateway once integrated.
**Roles:** Client
**Routes:** `/book/[bookingId]/payment` (method selector extended)

**Functionality**
- Method selector: Card, GCash, Maya, QR Ph, Online Banking, Manual Bank/QR (fallback).
- Flow: Select Method → Secure Gateway Checkout (hosted by gateway partner — Viaje never touches card data) → Processing → Payment Successful → Booking Updated.
- Transaction record shows gateway reference, method, amount, status, timestamp — populated via webhook, not user input.

**Data model** — extends `payments` with `gatewayReference, gatewayWebhookStatus, cardLast4(display only)`. Requires a Next.js API route to receive and verify gateway webhooks and update Firestore server-side (never trust client-reported payment status).

---

## 13. Phase 3 (Future) — Flight Search Placeholder

**Purpose:** Conceptual placeholder for a future flight-search partner integration (e.g. Skyscanner). Not functional in Phase 1.
**Roles:** Guest/Client
**Routes:** `/flights`

**Functionality**
- Non-functional search form UI (From/To/Dates/Travelers/Cabin) clearly labeled "Future Flight Search Integration — Subject to API/Partner Access."
- No booking or ticketing capability until a partner/API model is confirmed.

**Data model** — none yet; reserve a `flightSearchLeads` collection if you want to capture interest in the meantime.

---
---

# AI Agent Prompts (Per Module)

Copy one block at a time into your coding agent. Each is self-contained.

## Prompt — 0. Project Foundations

```
You are building the foundation of "Viaje Travel and Tours," a travel agency
booking and client-management platform.

Stack:
- Next.js (App Router), TypeScript
- Tailwind CSS + shadcn/ui for all UI components
- Firebase Authentication + Firestore for auth and database
- Cloudflare R2 for file/media storage (package images, receipts, travel
  documents, generated PDFs)

Task: Scaffold the project foundation.
1. Initialize a Next.js App Router project with TypeScript and Tailwind.
   Install and configure shadcn/ui (base theme).
2. Set up Firebase: client SDK for the browser, Admin SDK for server-side
   route handlers. Add environment variables for both.
3. Set up Cloudflare R2 client (S3-compatible SDK) with a small
   `lib/storage.ts` helper exposing `uploadFile`, `getSignedUrl`, and
   `deleteFile`, targeting these buckets: viaje-package-media,
   viaje-payment-receipts, viaje-travel-documents (private/signed-URL
   only), viaje-generated-pdfs, viaje-site-media.
4. Define Firestore security rules implementing two roles via a custom
   claim `role`: "client" and "admin". Clients may only read/write
   documents where `clientId == request.auth.uid` on: bookings,
   transactions, payments, documentChecklists. Only admins may write to:
   packages, websiteContent, and any status field.
5. Add Next.js middleware that protects `/dashboard/*` routes (client role
   required) and `/admin/*` routes (admin role required), redirecting
   unauthenticated users to /login.
6. Create shared TypeScript types for these Firestore collections and their
   status enums (do not implement UI yet, just types + Firestore
   converters):
   - Booking status: inquiry, quotation_sent, reserved, awaiting_payment,
     confirmed, processing, completed, cancelled
   - Payment status: unpaid, submitted, for_verification, partially_paid,
     paid, rejected, refunded
   - Document status: required, submitted, under_review, approved,
     needs_replacement
   - Quotation status: draft, sent, viewed, accepted, expired, converted
7. Build a reusable shadcn-based `<StatusBadge status={...} />` component
   that maps each of the above enum values to a consistent color (green =
   good/paid/approved, amber = pending/in-review, red = unpaid/rejected/
   missing, slate = draft/neutral).

Deliverable: a running Next.js app with Firebase + R2 wired up, security
rules deployed, protected route middleware working, and the shared types +
StatusBadge component ready for the modules that follow.
```

## Prompt — 1. Public Website (Home, Package Listing, Package Details)

```
Stack: Next.js App Router + TypeScript, Tailwind + shadcn/ui, Firestore,
Cloudflare R2 for images. Assume project foundation (auth, Firestore
types, StatusBadge) already exists.

Build the public marketing site. No authentication required for any of
these routes.

1. `/` (Home): hero section with tagline "We make the plan, you pack your
   bags."; Discover Viaje intro; Core Values grid (V-I-A-J-E, values
   editorially fixed, not from CMS in Phase 1); Why Choose Us (4 icon
   cards); Services grid (Ticketing / Tour Packages / Travel Services);
   DOT + ISO 9001:2015 accreditation badges; previous-clients logo strip;
   Our Market tag list; Featured Packages (query `packages` where
   status == "published", limit 6, ordered by createdAt desc); Custom
   Trip CTA linking to /customize-my-trip; photo gallery; contact/inquiry
   form that writes a lead doc.

2. `/packages` (Package Listing): server-rendered list of `packages`
   where status == "published". Filters: domestic/international toggle,
   destination select, travel month select, package type chips, duration
   chips, price range slider. Client-side search box. Sort dropdown
   (recommended, price asc/desc, soonest departure — soonest departure
   requires reading each package's earliest upcoming `departures` doc).
   Paginate 8 per page.

3. `/packages/[packageId]`: fetch the package doc plus its `departures`,
   `flights`, `hotels`, `itineraryDays` subcollections. Render: image
   gallery, overview grid (duration/airline/hotel class/departure
   city/type/starting price), selectable departure-date list (each shows
   surcharge if any, updates the sticky booking card's price on select),
   flight info cards, hotel info card, day-by-day itinerary timeline,
   inclusions/exclusions two-column list, optional add-ons grid, important
   notes callout, "Download Brochure" (signed R2 URL), and a sticky
   booking summary card with a "Book This Package" button linking to
   `/book/[packageId]?departureId=...`.

Use shadcn/ui Card, Badge, Select, Slider, Tabs, and Sheet (for mobile
filters) components throughout. Keep all copy and mock data
Philippines-travel-agency realistic (₱ pricing, Cebu Pacific-style
routing) but do not hardcode data that should come from Firestore —
featured packages, listing, and details must all be data-driven.
```

## Prompt — 2. Guest Booking & Manual Payment

```
Stack: Next.js App Router + TypeScript, Tailwind + shadcn/ui, Firestore,
Cloudflare R2 (viaje-payment-receipts bucket). No login required for this
flow — it's guest checkout.

Build the booking + manual payment flow.

1. `/book/[packageId]`: a 5-step client-side wizard (Package → Travelers
   → Add-ons → Review → Payment) using a shadcn Stepper-style UI (you can
   build this with Tabs + a controlled `currentStep` state; do not let
   the user skip ahead of a completed step).
   - Step "Travelers": quantity steppers for Adults / Children with bed /
     Children without bed / Infants, each with per-type pricing pulled
     from the package's `pricing` map. Then render one traveler-info form
     block per adult traveler (full name, birthdate, email, mobile,
     nationality; passport number optional/only if package requires it).
   - Step "Add-ons": checklist of add-ons defined on the package
     (baggage, transfers, optional tours, insurance) with live-updating
     cost summary sidebar.
   - Step "Review": full cost breakdown (per traveler type × price, plus
     add-ons, total), and a confirmation checkbox.
   - On final submit: create a Firestore `bookings` doc (status
     "reserved", clientId null, source "website"), a `travelers`
     subcollection doc per traveler, store selected add-ons on the
     booking doc, and create a `secureLinks` doc (type "activation",
     7-day expiry) tied to the booking. Redirect to
     `/book/[bookingId]/payment`.

2. `/book/[bookingId]/payment`: fetch the booking, show booking
   reference, amount due, due date, and a status badge (starts
   "Awaiting Payment"). Render a QR payment panel with method tabs
   (GCash/Maya/Bank QR — static QR images/text for Phase 1, no real
   payment processing). Below it, a "Submit Payment for Verification"
   form: payment method select, amount paid, reference number, payment
   date, file upload (image/PDF, max 10MB) uploaded to
   viaje-payment-receipts in R2, and notes. On submit, create a
   `payments` doc (status "submitted") and a `transactions` doc if one
   doesn't exist yet for this booking, then show a confirmation state
   with the copy: "Submitting a receipt does not automatically confirm
   payment. Viaje will verify the transaction before marking the booking
   as paid." Do NOT auto-update booking/payment status to paid on
   submission — that only happens via the admin verification module.

Validate all monetary calculations server-side (a Next.js route handler)
before writing to Firestore — never trust client-computed totals.
```

## Prompt — 3. Authentication & Account Activation

```
Stack: Next.js App Router + TypeScript, Tailwind + shadcn/ui, Firebase
Auth + Firestore.

Build login and the invited-guest account-activation flow.

1. `/login`: email + password form using Firebase Auth
   signInWithEmailAndPassword. On success, read the user's `role` custom
   claim and redirect to /dashboard (client) or /admin (admin).
2. `/forgot-password`: email input, calls Firebase
   sendPasswordResetEmail, shows confirmation state.
3. `/activate/[token]`: server-side, look up `secureLinks/{token}`.
   If missing/expired/used, render an "This link has expired" state with
   a "Contact Viaje" CTA. If valid, fetch the linked `bookings` doc to
   show a "Booking VJ-XXXX-XXXXX — Invited by Viaje Travel and Tours"
   context card, pre-fill the traveler's email (read-only), and render a
   set-password form. On submit:
   - Create the Firebase Auth user (or link if email already has a
     pending user) via a Next.js API route using the Admin SDK.
   - Create a `users/{uid}` doc with role "client", accountStatus
     "active".
   - Set the custom claim `role: "client"`.
   - Backfill `clientId` on the referenced `bookings` doc.
   - Mark the `secureLinks` doc as used.
   - Sign the user in client-side and redirect to
     `/dashboard/bookings/[bookingId]`.

Style the page as a split layout: left panel is a dark navy gradient
panel with a short welcome message, right panel is the form, consistent
with the rest of the site's navy/red brand palette. Use shadcn/ui Input,
Button, and Alert components.
```

## Prompt — 4. Client Dashboard

```
Stack: Next.js App Router + TypeScript, Tailwind + shadcn/ui, Firestore,
Cloudflare R2 (signed URLs for document downloads). All routes under
`/dashboard/*` require an authenticated "client" role (already enforced
by middleware from the foundations module).

Build the client self-service dashboard. Every query below MUST be scoped
to `clientId == currentUser.uid` — never fetch another client's data.

1. `/dashboard`: overview cards (upcoming trips count, outstanding
   balance sum across bookings, documents-required count, recent
   payments sum), a list of upcoming-trip cards (package cover, name,
   booking ref, dates, status + payment status badges, "View Booking"
   link), a quick-actions row (Submit Payment, Upload Documents, Download
   Quotation, Contact Viaje), and a recent-activity timeline pulled from
   `activityLog` filtered to this client's bookings.

2. `/dashboard/bookings/[bookingId]`: verify the booking belongs to the
   current user, then render a horizontal pipeline progress indicator
   (Quotation → Reserved → Payment → Documents → Confirmed → Travel)
   driven by the booking's status, a summary card (package, dates,
   travelers, total/paid/balance), a payment-history table from
   `payments` where bookingId matches, a balance-due card with a "Make a
   Payment" button linking to the manual payment page, and a documents-
   required mini card linking to the document center.

3. `/dashboard/transactions`: ledger table of all `transactions` (and
   their `payments`) across every booking owned by this client — columns:
   transaction #, booking, date, description, amount, paid, balance,
   status. Filter chips for All / Full Payment / Deposit / Partial
   Payment.

4. `/dashboard/documents`: list `documentChecklists` for this client's
   bookings, each expandable to its `documents` subcollection. Each
   document row: label, status badge, and either an "Upload" button
   (opens a file picker, uploads to viaje-travel-documents via a signed
   PUT URL from a Next.js API route, then updates the doc status to
   "submitted") or a "View" button (fetches a signed GET URL, never a
   public URL) if already submitted. Show any staff remarks on the
   checklist.

5. `/dashboard/quotations/[quotationId]`: read-only, formatted like a
   printable document — Viaje letterhead, quotation #, client info, trip
   details, itemized line items table, totals, payment terms, validity.
   "Download PDF" fetches the pre-generated PDF from R2 (or triggers
   generation via API route if not yet generated). "Proceed to Booking"
   converts the quotation into a booking if not already converted.

Use shadcn/ui Table, Card, Tabs, Progress/Stepper, and Dialog (for
upload) components. Keep the visual language consistent: navy/red brand
colors, status badges from the shared StatusBadge component.
```

## Prompt — 5. Admin — Operations Dashboard

```
Stack: Next.js App Router + TypeScript, Tailwind + shadcn/ui, Firestore.
Route `/admin` requires an authenticated "admin" role.

Build the admin operations dashboard with a persistent left sidebar
(Dashboard, Transactions, Bookings, Packages, Clients, Payments,
Documents, Quotations, Custom Requests, Website Content, Reports,
Settings — only Dashboard needs to be functional in this pass, the rest
just need working nav links to routes built in later prompts).

`/admin`:
- KPI cards: new bookings this week (count query on bookings.createdAt),
  pending payments total (sum of balance across bookings not fully
  paid), payments for verification (count of payments where status ==
  "for_verification"), upcoming departures in next 30 days.
- Recent transactions table (last 10, joined with client name + package
  title).
- Upcoming departures table (bookings joined to their package's next
  departure date, sorted ascending, next 5).
- Payment verification queue preview (top 3 payments needing review,
  each with a "Review" button linking to /admin/payments/verification).
- New custom-trip inquiries preview (latest `customRequests` where
  status == "new").
- Recent client activity feed from `activityLog`, latest 5 entries,
  human-readable ("Juan Dela Cruz uploaded passport — 10 minutes ago").

Use shadcn/ui Card, Table, and Avatar components. Build the KPI queries
as Firestore aggregation queries where possible (count(), sum()) rather
than pulling full documents client-side.
```

## Prompt — 6. Admin — Transactions & Bookings

```
Stack: Next.js App Router + TypeScript, Tailwind + shadcn/ui, Firestore.
Routes under `/admin/*` require an authenticated "admin" role.

Build transaction creation and booking management for staff.

1. `/admin/transactions/new`: a form (not a strict wizard — staff should
   be able to jump between sections) with:
   - Source tag chips: Phone Inquiry / Messenger / Walk-in / Existing
     Customer / Corporate-Group.
   - Customer section: search-select an existing `users` doc (role
     client) OR a "create new customer" inline form (name, email,
     mobile) that creates a `users` doc with accountStatus "pending"
     (no Firebase Auth account yet — that happens on activation).
   - Package/service section: select an existing package + departure, OR
     mark as a custom service with a free-text description.
   - Line items table: editable rows (item label, qty, unit price →
     auto-computed amount), add/remove rows.
   - Discount field + "Authorized By" text field (record who approved
     it — Phase 1 has no permission enforcement, just an audit field).
   - Internal notes textarea (staff-only).
   - Payment terms: Full Payment / Deposit / Partial Payment chips, with
     amount + due date fields that adjust based on selection.
   - Actions: "Generate Quotation" (creates a `quotations` doc in draft
     status from the current line items, without creating a booking
     yet) and "Create Transaction" (creates the `bookings` doc with
     status "reserved" or "awaiting_payment" depending on terms, the
     `transactions` doc, and an `activityLog` entry). After creation,
     show a "Send to Customer" button that creates a `secureLinks`
     activation token and (stub for now) triggers a
     transactional email containing the transaction summary, activation
     link, and payment instructions.

2. `/admin/bookings`: table of all bookings with filters by status,
   search by client name or booking reference.

3. `/admin/bookings/[bookingId]`: tabs (Details, Travelers, Payments,
   Documents, Activity). Details tab: editable trip fields, a status
   Select driven by the booking status enum, internal notes list (add
   new note, staff-only — must be excluded from any client-facing
   Firestore read via security rules), and a sidebar with balance
   summary, client mini-card linking to their admin client profile, and
   quick actions (Send Payment Link, Request Document, Send Email).

All writes here must also append an `activityLog` entry recording the
acting admin's uid, the entity affected, and the action taken.
```

## Prompt — 7. Admin — Package Management

```
Stack: Next.js App Router + TypeScript, Tailwind + shadcn/ui, Firestore,
Cloudflare R2 (viaje-package-media bucket).
Routes under `/admin/*` require an authenticated "admin" role.

Build the package editor.

1. `/admin/packages`: table/grid of all packages with status badge
   (published/draft/archived), quick actions (edit, duplicate, publish/
   unpublish, archive), and a "New Package" button.

2. `/admin/packages/[packageId]/edit` (also used for "new" via a
   temporary id): tabbed editor using shadcn Tabs:
   - Basic Info: title, destination, country, domestic/international
     toggle, duration, description, cover image upload (R2), gallery
     image uploads (R2, multiple).
   - Schedule: repeatable rows for `departures` (start date, end date,
     slots, base price, surcharge, availability status), add/remove
     rows, writes to the `departures` subcollection.
   - Pricing: adult / child-with-bed / child-without-bed / infant /
     single-supplement price fields, saved on the package doc's
     `pricing` map.
   - Flight: repeatable flight-leg rows (airline, flight number, origin,
     destination, departure/arrival time) → `flights` subcollection.
   - Hotel: hotel name, category, room info, notes, image uploads (R2)
     → `hotels` subcollection.
   - Itinerary: day-by-day editor — add/remove/reorder day cards, each
     with a title and description textarea → `itineraryDays`
     subcollection, ordered by `dayNumber`.
   - Conditions: inclusions / exclusions / requirements / terms as
     editable bullet lists (array of strings) on the package doc.
   - Promotional Material: brochure PDF upload to R2, stored as
     `brochureUrl` on the package doc.
   - A persistent "Save Package" button in the top bar saves the
     currently active tab's data (autosave per tab is fine — don't
     require the whole form to be filled before any save succeeds).

Validate that every published package has at least one active
departure, a cover image, and pricing filled in before allowing the
status to be set to "published" — surface this as inline validation, not
a silent failure.
```

## Prompt — 8. Admin — Client Management

```
Stack: Next.js App Router + TypeScript, Tailwind + shadcn/ui, Firestore.
Routes under `/admin/*` require an authenticated "admin" role.

Build the admin client profile view.

1. `/admin/clients`: searchable/sortable table of `users` where
   role == "client" — columns: name, email, mobile, account status,
   total bookings (aggregate), outstanding balance (aggregate).

2. `/admin/clients/[clientId]`: header with avatar/initials, name,
   email, mobile, account-status badge, and action buttons (Send Login
   Link, Send Payment Link, Request Document, Create Booking — this last
   one deep-links into the Create Transaction flow with the customer
   pre-selected). Summary cards: total bookings, upcoming bookings,
   outstanding balance, documents pending. Tabs: Bookings, Transactions,
   Payments, Quotations, Documents, Activity — each a filtered table
   scoped to `clientId == this client`, reusing the table components
   built in the Client Dashboard and Admin Bookings prompts where
   possible rather than rebuilding them.

Keep this page read-heavy and fast: use Firestore composite indexes on
(clientId, createdAt) for each of bookings/transactions/payments/
quotations/documentChecklists so the tabs load without full collection
scans.
```

## Prompt — 9. Admin — Payment Verification

```
Stack: Next.js App Router + TypeScript, Tailwind + shadcn/ui, Firestore,
Cloudflare R2 (signed URLs for viewing receipts).
Route `/admin/payments/verification` requires an authenticated "admin"
role.

Build the payment verification queue.

- Fetch all `payments` where status == "for_verification", newest first.
  Also show tabs/filters for "Approved Today" and "Rejected" as
  secondary views.
- Each row/card: receipt thumbnail (signed R2 URL, click to view full
  size in a Dialog), customer name, booking reference, expected amount,
  submitted amount, method, reference number, submission date, and any
  customer notes.
- Actions per row, each opening a confirmation Dialog before committing:
  - **Approve**: sets payment status "paid", recalculates and updates
    the linked `transactions` and `bookings` amountPaid/balance fields,
    updates booking status to "confirmed" if balance reaches zero,
    writes an `activityLog` entry, and (stub) triggers a payment-
    confirmed email to the client.
  - **Reject**: requires a reason (textarea), sets payment status
    "rejected", writes `activityLog`, (stub) emails the client asking
    for a new proof of payment.
  - **Mark Partial**: prompts for the actually-received amount, sets
    payment status "partially_paid", updates booking balance
    accordingly.
  - **Request New Proof**: sets payment status back to "submitted" with
    an admin note, (stub) emails the client.

All balance recalculation math must happen in a Next.js API route (or
Firestore transaction) — never trust or perform this math purely on the
client, to avoid race conditions between concurrent admin actions on the
same booking.
```

## Prompt — 10. Admin — Document Management

```
Stack: Next.js App Router + TypeScript, Tailwind + shadcn/ui, Firestore,
Cloudflare R2 (viaje-travel-documents bucket, signed URLs only — this
bucket must never be public given passport/PSA content).
Routes under `/admin/*` require an authenticated "admin" role.

Build staff-side document checklist management.

1. `/admin/documents`: list of active `documentChecklists` across all
   clients, with a progress indicator (submitted / total) per checklist,
   filterable by status/client.

2. `/admin/documents/[checklistId]`: checklist header (title, related
   booking reference), a "+ Assign New Checklist" action for creating
   additional checklists on the same booking (e.g. multiple visa types),
   and the document list — each row: label, status badge, and
   context-appropriate actions:
   - status "required" → "Send Reminder" (stub email trigger)
   - status "submitted"/"under_review" → "View" (signed URL) +
     "Approve" / "Reject" (reject requires selecting/typing a reason,
     sets status "needs_replacement")
   - status "approved" → "View" only
   A staff-only internal notes textarea at the bottom, saved to the
   checklist doc, never exposed to the client-facing document center
   queries.

Enforce via Firestore security rules that only admins can change a
document's status field, and that the `viaje-travel-documents` bucket is
never accessed via a public URL — always via a short-lived signed URL
minted by a Next.js API route that first checks the requester (admin, or
the owning client) against Firestore.
```

## Prompt — 11. Admin — Quotation Builder

```
Stack: Next.js App Router + TypeScript, Tailwind + shadcn/ui, Firestore,
Cloudflare R2 (viaje-generated-pdfs bucket).
Routes under `/admin/*` require an authenticated "admin" role.

Build the quotation builder.

1. `/admin/quotations`: table of all quotations with status badge
   (draft/sent/viewed/accepted/expired/converted), search/filter, "New
   Quotation" button.

2. `/admin/quotations/new` and `/admin/quotations/[quotationId]`:
   - Client select, package/service select, expiration date, travel
     dates.
   - Editable line-items table (item, qty, unit price, auto-computed
     amount, remove row, "+ Add Item").
   - Discount field, internal notes (staff-only).
   - Live-updating total preview sidebar showing subtotal, discount,
     total, and validity date.
   - Actions: **Preview** (renders the client-facing formatted view in a
     Dialog/new tab), **Download PDF** (server-side PDF generation via a
     Next.js API route — e.g. using @react-pdf/renderer or Puppeteer —
     uploaded to viaje-generated-pdfs, URL saved on the quotation doc),
     **Email to Customer** (sets status "sent", stub email trigger),
     **Convert to Booking** (only enabled once status is "accepted" or
     manually forced by admin — creates a `bookings` doc referencing
     this quotation's line items and total, sets quotation status
     "converted").

Quotation numbers should be human-friendly and sequential-looking (e.g.
QT-2026-0942) — generate via a Firestore counter document or a Cloud
Function, not via random IDs, since staff will reference these verbally
with clients.
```

## Prompt — 12. Phase 2 (Future) — Automated Payment Gateway

```
Stack: Next.js App Router + TypeScript, Tailwind + shadcn/ui, Firestore.
This is a FUTURE-phase module — build it as clearly-labeled UI plus the
webhook plumbing, but do not wire it as the default payment path yet;
manual QR payment (from the Guest Booking prompt) remains primary.

Extend `/book/[bookingId]/payment` with a payment-method selector: Card,
GCash, Maya, QR Ph, Online Banking, and "Manual Bank/QR" (which falls
back to the existing manual flow). For Card/GCash/Maya/QR Ph/Online
Banking, redirect to your chosen payment gateway's hosted checkout page
(do not build a custom card form — never let raw card data touch your
own server). On return, implement a Next.js API route
`/api/webhooks/payment-gateway` that:
- Verifies the webhook signature per the gateway's documentation.
- Looks up the associated booking/transaction by the reference passed at
  checkout initiation.
- Updates the `payments` doc with `gatewayReference`, `method`, `amount`,
  and `status` derived from the webhook payload — never from a client-
  side redirect query param, since those are spoofable.
- Updates booking status/balance the same way the manual-verification
  approval flow does (reuse that logic).

Show the client a "Processing" state that polls the payment doc (or uses
a Firestore real-time listener) until the webhook has landed, then
transitions to "Payment Successful."
```

## Prompt — 13. Phase 3 (Future) — Flight Search Placeholder

```
Stack: Next.js App Router + TypeScript, Tailwind + shadcn/ui.
This is a non-functional placeholder for a future flight-search
integration — do not connect any real flight API.

Build `/flights`: a page clearly labeled "Future Flight Search
Integration — Subject to API/Partner Access." Include a disabled-looking
search form (From, To, Departure date, Return date, Travelers, Cabin
class) and a submit button that is either disabled or, if clicked, shows
a toast/message explaining this feature isn't live yet. Optionally
capture interest by letting the user submit their search criteria to a
`flightSearchLeads` Firestore collection instead of performing a real
search, so Viaje can gauge demand before committing to a partner
integration.
```
