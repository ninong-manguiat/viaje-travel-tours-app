import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { ensureDefaultAirlines } from "@/lib/airline-data";
import { airlineNameKey, newAirline, normalizeAirline } from "@/lib/airlines";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

function validateAirline(airline: ReturnType<typeof normalizeAirline>) {
  if (!airline.name) return "Airline name is required.";
  return "";
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();

  await ensureDefaultAirlines();
  const { adminDb } = await import("@/lib/firebase-admin");
  const snapshot = await adminDb.collection("airlines").orderBy("name").get();
  const airlines = snapshot.docs.map((doc) => normalizeAirline({ id: doc.id, ...doc.data() }));

  return NextResponse.json({ airlines });
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();

  await ensureDefaultAirlines();
  const body = await request.json().catch(() => ({}));
  const airline = normalizeAirline({ ...newAirline(), ...body?.airline });
  airline.nameKey = airlineNameKey(airline.name);
  const error = validateAirline(airline);

  if (error) return NextResponse.json({ error }, { status: 400 });

  const { adminDb } = await import("@/lib/firebase-admin");
  const duplicate = await adminDb.collection("airlines").where("nameKey", "==", airline.nameKey).limit(1).get();
  if (!duplicate.empty) return NextResponse.json({ error: "An airline with this name already exists." }, { status: 400 });

  await adminDb.collection("airlines").doc(airline.id).set({
    ...airline,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ airline });
}
