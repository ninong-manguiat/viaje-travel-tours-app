# Viaje Phase Plan

This app should be built phase by phase from `docs/BLUEPRINT.md`.

## Phase 0 - Foundation

- Next.js App Router, TypeScript, Tailwind setup
- `qa` and `prod` environment files
- Firebase client/admin setup
- Cloudflare R2 helper setup
- Firestore rules and indexes
- Shared TypeScript collection types and status enums
- `StatusBadge` and minimal shell UI
- Build/deploy/version scripts

## Phase 1 - Public Booking Core

- Public homepage
- Package listing and package detail
- Guest booking wizard
- Manual proof-of-payment upload
- Account activation

## Phase 2 - Client Self-Service

- Client dashboard
- Booking detail
- Transaction ledger
- Document center
- Quotation viewing

## Phase 3 - Admin Operations

- Admin dashboard
- Transaction and booking management
- Package management
- Client management
- Payment verification
- Document management
- Quotation builder

## Phase 4 - Future Integrations

- Automated payment gateway
- Flight search placeholder or partner-backed implementation
