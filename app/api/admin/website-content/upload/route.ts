import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage";

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function POST(request: NextRequest) {
  if (request.cookies.get("viaje-role")?.value !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = String(formData.get("folder") || "website-content");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const key = `website-content/${folder}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const url = await uploadFile("siteMedia", key, bytes, file.type || "application/octet-stream");

  return NextResponse.json({ url, key, environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.APP_ENV ?? "local" });
}
