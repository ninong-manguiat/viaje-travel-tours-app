# Viaje Phase Status

Use this alongside `docs/PHASE_PLAN.md` and `docs/BLUEPRINT.md`.

## Phase 0 - Foundation

Status: verified

- Dependencies installed and locked with `package-lock.json`
- `npm run build` passes
- `npm run typecheck` passes
- Typed route issues fixed by adding missing public/admin routes and typing navigation links
- Firebase client initialization is lazy so auth pages can prerender without real environment secrets

## Phase 1 - Public Booking Core

Status: in progress

- Public homepage exists
- Package listing exists
- Package detail exists
- Guest booking wizard exists as UI scaffold
- Manual payment page exists as UI scaffold
- Account activation page exists as UI scaffold
- Custom trip inquiry page exists as UI scaffold
- Next focus: persist bookings, travelers, transactions, secure links, and payment proof metadata to Firebase/R2

## Phase 2 - Client Self-Service

Status: scaffolded

- Dashboard, booking detail, transactions, documents, and quotation pages exist
- Next focus: replace sample data with authenticated Firestore queries

## Phase 3 - Admin Operations

Status: scaffolded

- Dashboard, bookings, clients, packages, transactions, payments, documents, and quotations routes exist
- Next focus: implement admin CRUD, payment verification state changes, document review, and quotation builder

## Phase 4 - Future Integrations

Status: placeholder

- Flight inquiry placeholder exists
- Next focus: payment gateway and flight search integration decisions
