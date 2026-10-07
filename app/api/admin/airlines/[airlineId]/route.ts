import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { ensureDefaultAirlines } from "@/lib/airline-data";
import { airlineNameKey, defaultAirlines, normalizeAirline } from "@/lib/airlines";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

async function docRef(airlineId: string) {
  const { adminDb } = await import("@/lib/firebase-admin");
  return adminDb.collection("airlines").doc(airlineId);
}

function validateAirline(airline: ReturnType<typeof normalizeAirline>) {
  if (!airline.name) return "Airline name is required.";
  return "";
}

async function airlineIsUsed(airline: ReturnType<typeof normalizeAirline>) {
  const { adminDb } = await import("@/lib/firebase-admin");
  const byId = await adminDb.collection("packages").where("airlineId", "==", airline.id).limit(1).get();
  if (!byId.empty) return true;

  const legacyName = defaultAirlines.find((item) => item.id === airline.id)?.name;
  const names = Array.from(new Set([airline.name, legacyName].filter(Boolean)));
  for (const name of names) {
    const byName = await adminDb.collection("packages").where("airline", "==", name).limit(1).get();
    if (!byName.empty) return true;
  }
  return false;
}

export async function GET(request: NextRequest, { params }: { params: { airlineId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const snapshot = await (await docRef(params.airlineId)).get();
  if (!snapshot.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ airline: normalizeAirline({ id: snapshot.id, ...snapshot.data() }) });
}

export async function PUT(request: NextRequest, { params }: { params: { airlineId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  await ensureDefaultAirlines();
  const body = await request.json().catch(() => ({}));
  const airline = normalizeAirline({ ...body?.airline, id: params.airlineId });
  airline.nameKey = airlineNameKey(airline.name);
  const error = validateAirline(airline);

  if (error) return NextResponse.json({ error }, { status: 400 });

  const { adminDb } = await import("@/lib/firebase-admin");
  const duplicate = await adminDb.collection("airlines").where("nameKey", "==", airline.nameKey).limit(2).get();
  const duplicateDoc = duplicate.docs.find((doc) => doc.id !== params.airlineId);
  if (duplicateDoc) return NextResponse.json({ error: "An airline with this name already exists." }, { status: 400 });

  await (await docRef(params.airlineId)).set({ ...airline, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return NextResponse.json({ airline });
}

export async function DELETE(request: NextRequest, { params }: { params: { airlineId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const snapshot = await (await docRef(params.airlineId)).get();
  if (!snapshot.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const airline = normalizeAirline({ id: snapshot.id, ...snapshot.data() });
  if (await airlineIsUsed(airline)) {
    return NextResponse.json({ error: "This airline is already used by a package. Deactivate it instead." }, { status: 400 });
  }

  await (await docRef(params.airlineId)).delete();
  return NextResponse.json({ ok: true });
}
