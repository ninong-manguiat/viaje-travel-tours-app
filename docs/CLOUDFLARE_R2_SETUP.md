# Cloudflare R2 Setup

Viaje uses Cloudflare R2 for uploaded and generated files. Firebase remains the auth/database layer; R2 stores binary assets.

## Buckets

Create these buckets in both environments.

| Purpose | QA bucket | Prod bucket |
|---|---|---|
| Package media | `viaje-package-media-qa` | `viaje-package-media` |
| Payment receipts | `viaje-payment-receipts-qa` | `viaje-payment-receipts` |
| Travel documents | `viaje-travel-documents-qa` | `viaje-travel-documents` |
| Generated PDFs | `viaje-generated-pdfs-qa` | `viaje-generated-pdfs` |
| Site media | `viaje-site-media-qa` | `viaje-site-media` |

## Access Policy

Keep these private:

- `viaje-payment-receipts-qa`
- `viaje-payment-receipts`
- `viaje-travel-documents-qa`
- `viaje-travel-documents`
- `viaje-generated-pdfs-qa`
- `viaje-generated-pdfs`

These may be public through a custom domain or public R2 URL if you want direct image delivery:

- `viaje-package-media-qa`
- `viaje-package-media`
- `viaje-site-media-qa`
- `viaje-site-media`

For private files, the app should serve signed URLs only after checking Firestore ownership or admin role.

## R2 API Token

In Cloudflare, create an R2 API token with object read/write access for the Viaje buckets.

Save the generated values into `.env.qa` and `.env.prod`:

```bash
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_PUBLIC_BASE_URL=
```

`CLOUDFLARE_R2_ACCOUNT_ID` is visible in the Cloudflare dashboard URL or in the R2 overview.

`CLOUDFLARE_R2_PUBLIC_BASE_URL` should be the base URL used for public assets. Examples:

```bash
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://assets-qa.your-domain.com
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://assets.your-domain.com
```

If you do not configure a public domain yet, leave public delivery disabled and use signed URLs for all reads.

## Validate Env

After filling `.env.qa` and `.env.prod`, run:

```bash
npm run validate:r2:qa
npm run validate:r2:prod
```

These commands only check that required values exist; they do not connect to Cloudflare.

## App Mapping

The storage helper maps app bucket aliases to env vars:

| App alias | Env var |
|---|---|
| `packageMedia` | `CLOUDFLARE_R2_PACKAGE_MEDIA_BUCKET` |
| `paymentReceipts` | `CLOUDFLARE_R2_PAYMENT_RECEIPTS_BUCKET` |
| `travelDocuments` | `CLOUDFLARE_R2_TRAVEL_DOCUMENTS_BUCKET` |
| `generatedPdfs` | `CLOUDFLARE_R2_GENERATED_PDFS_BUCKET` |
| `siteMedia` | `CLOUDFLARE_R2_SITE_MEDIA_BUCKET` |

The R2 S3 endpoint format is:

```bash
https://<CLOUDFLARE_R2_ACCOUNT_ID>.r2.cloudflarestorage.com
```
