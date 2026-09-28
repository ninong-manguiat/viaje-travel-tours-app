import { NextRequest, NextResponse } from "next/server";
import { pageCursor, paginatedDocs } from "@/lib/admin-pagination";

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

function serializeBooking(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    ...data,
    id,
    createdAt: timestampValue(data.createdAt),
    updatedAt: timestampValue(data.updatedAt),
  };
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();

  const { adminDb } = await import("@/lib/firebase-admin");
  const collection = adminDb.collection("bookings");
  const page = await paginatedDocs({
    query: collection.orderBy("createdAt", "desc"),
    collection,
    cursor: pageCursor(request),
  });
  const bookings = page.docs.map((doc) => serializeBooking(doc.id, doc.data()));

  return NextResponse.json({ bookings, nextCursor: page.nextCursor, hasNext: page.hasNext });
}
