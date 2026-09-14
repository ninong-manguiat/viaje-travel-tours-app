import { NextRequest, NextResponse } from "next/server";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

function timestampValue(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value && typeof value === "object" && "seconds" in value && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000).toISOString();
  }

  return typeof value === "string" ? value : "";
}

function serializeBookingNotice(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    reference: String(data.reference || id),
    packageTitle: String(data.packageTitle || "New booking"),
    createdAt: timestampValue(data.createdAt),
  };
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");
  const { adminDb } = await import("@/lib/firebase-admin");

  if (!since) {
    const latestSnapshot = await adminDb.collection("bookings").orderBy("createdAt", "desc").limit(1).get();
    const latest = latestSnapshot.docs[0];
    const latestCreatedAt = latest ? timestampValue(latest.data().createdAt) : new Date().toISOString();

    return NextResponse.json({ bookings: [], latestCreatedAt });
  }

  const sinceDate = new Date(since);
  if (Number.isNaN(sinceDate.getTime())) {
    return NextResponse.json({ error: "Invalid checkpoint" }, { status: 400 });
  }

  const snapshot = await adminDb
    .collection("bookings")
    .where("createdAt", ">", sinceDate)
    .orderBy("createdAt", "asc")
    .limit(20)
    .get();

  const bookings = snapshot.docs.map((doc) => serializeBookingNotice(doc.id, doc.data()));
  const latestCreatedAt = bookings.at(-1)?.createdAt || since;

  return NextResponse.json({ bookings, latestCreatedAt });
}
