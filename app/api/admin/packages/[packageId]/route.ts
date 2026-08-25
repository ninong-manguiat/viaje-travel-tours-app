import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { defaultPackages, normalizePackage } from "@/lib/package-content";

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

  const snapshot = await (await docRef(params.packageId)).get();
  const fallback = defaultPackages().find((item) => item.id === params.packageId || item.slug === params.packageId);
  if (!snapshot.exists) {
    return fallback ? NextResponse.json({ package: fallback }) : NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ package: normalizePackage({ id: snapshot.id, ...snapshot.data() }) });
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
