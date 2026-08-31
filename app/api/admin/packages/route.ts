import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { listPackages } from "@/lib/package-data";
import { newPackage, normalizePackage } from "@/lib/package-content";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

async function collectionRef() {
  const { adminDb } = await import("@/lib/firebase-admin");
  return adminDb.collection("packages");
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();

  const packages = await listPackages();

  return NextResponse.json({ packages });
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const pkg = normalizePackage({ ...newPackage(), ...body?.package });
  const docRef = (await collectionRef()).doc(pkg.id);
  await docRef.set({ ...pkg, updatedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp() });

  return NextResponse.json({ package: pkg });
}
