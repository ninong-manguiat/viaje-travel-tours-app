import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl as presign } from "@aws-sdk/s3-request-presigner";

export type ViajeBucket = "packageMedia" | "paymentReceipts" | "travelDocuments" | "generatedPdfs" | "siteMedia";

const bucketMap: Record<ViajeBucket, string | undefined> = {
  packageMedia: process.env.CLOUDFLARE_R2_PACKAGE_MEDIA_BUCKET,
  paymentReceipts: process.env.CLOUDFLARE_R2_PAYMENT_RECEIPTS_BUCKET,
  travelDocuments: process.env.CLOUDFLARE_R2_TRAVEL_DOCUMENTS_BUCKET,
  generatedPdfs: process.env.CLOUDFLARE_R2_GENERATED_PDFS_BUCKET,
  siteMedia: process.env.CLOUDFLARE_R2_SITE_MEDIA_BUCKET
};

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? ""
  }
});

function resolveBucket(bucket: ViajeBucket) {
  const name = bucketMap[bucket];
  if (!name) throw new Error(`Missing R2 bucket env for ${bucket}`);
  return name;
}

export async function uploadFile(bucket: ViajeBucket, key: string, body: Buffer | Uint8Array | string, contentType?: string) {
  const Bucket = resolveBucket(bucket);
  await r2.send(new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType }));
  return `${process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL}/${Bucket}/${key}`;
}

export async function getSignedUrl(bucket: ViajeBucket, key: string, expiresIn = 600) {
  return presign(r2, new GetObjectCommand({ Bucket: resolveBucket(bucket), Key: key }), { expiresIn });
}

export async function getSignedPutUrl(bucket: ViajeBucket, key: string, contentType: string, expiresIn = 600) {
  return presign(r2, new PutObjectCommand({ Bucket: resolveBucket(bucket), Key: key, ContentType: contentType }), { expiresIn });
}

export async function deleteFile(bucket: ViajeBucket, key: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: resolveBucket(bucket), Key: key }));
}
