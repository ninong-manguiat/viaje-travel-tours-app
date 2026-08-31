import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getPackageById } from "@/lib/package-data";
import { normalizePackage } from "@/lib/package-content";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

async function docRef(packageId: string) {
  const { adminDb } = await import("@/lib/firebase-admin");
  return adminDb.collection("packages").doc(packageId);
}

export async function GET(request: NextRequest, { params }: { params: { packageId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const pkg = await getPackageById(params.packageId);
  if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ package: pkg });
}

export async function PUT(request: NextRequest, { params }: { params: { packageId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const body = await request.json();
  const pkg = normalizePackage({ ...body?.package, id: params.packageId });
  await (await docRef(params.packageId)).set({ ...pkg, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  return NextResponse.json({ package: pkg });
}

export async function DELETE(request: NextRequest, { params }: { params: { packageId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  await (await docRef(params.packageId)).delete();
  return NextResponse.json({ ok: true });
}
