import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage";

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const folder = String(formData.get("folder") || "payment-proofs");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const key = `${folder}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const url = await uploadFile("paymentReceipts", key, bytes, file.type || "application/octet-stream");

  return NextResponse.json({ url, key, environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.APP_ENV ?? "local" });
}
