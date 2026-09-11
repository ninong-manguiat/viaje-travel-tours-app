# Viaje Travel and Tours App

Next.js App Router implementation scaffolded from the attached Viaje Travel and Tours functional specification.

## Environments

Configuration lives in environment files:

- `.env.qa` for QA
- `.env.prod` for production

Start by copying the examples:

```bash
cp .env.qa.example .env.qa
cp .env.prod.example .env.prod
```

## Commands

```bash
npm install
npm run dev
npm run build:qa
npm run deploy:qa
npm run deploy:prod
```

`npm run deploy qa` and `npm run deploy prod` also work. Deployment currently builds with the matching env file and runs `firebase deploy --only hosting,firestore:rules,firestore:indexes --project <project id>`.

## Email

Transactional email infrastructure uses Resend. Configure these server-side variables in the matching environment file and in your deployment provider:


`NEXT_PUBLIC_APP_URL` is used to build absolute links and public email asset URLs. To send a guarded test email, sign in as admin and POST to `/api/admin/email/test-send` with:

```json
{
  "recipient": "test@example.com",
  "emailType": "BOOKING_RECEIVED"
}
```

Supported test email types are `BOOKING_RECEIVED`, `BOOKING_CONFIRMED`, `DOCUMENT_REQUEST`, `PAYMENT_REQUEST`, and `PAYMENT_CONFIRMED`. Test sending works in development; set `ENABLE_EMAIL_TEST_SEND=true` only when you intentionally want to allow the admin-only test route in a deployed environment.

## Versioning

The project starts at `1.1.0`.

- `npm run version:minor` moves `1.1.0` to `1.2.0`, then `1.3.0`, etc.
- `npm run version:major` moves `1.x.0` to `2.1.0`.

This follows your convention: the first number is the major component, and the decimal/minor number is for minor releases and bug fixes.

## Blueprint

See [docs/BLUEPRINT.md](docs/BLUEPRINT.md). It is copied from the provided project specification and should stay treated as the product source of truth.
