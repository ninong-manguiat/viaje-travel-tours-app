import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PAGE_SIZE, pageCursor, paginatedDocs, prefixSearchBounds } from "@/lib/admin-pagination";

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

function searchableValues(value: string) {
  const trimmed = value.trim();
  const values = new Set<string>();
  if (!trimmed) return [];
  values.add(trimmed);
  values.add(trimmed.toLowerCase());
  values.add(trimmed.toUpperCase());
  values.add(trimmed.replace(/\b\w/g, (letter) => letter.toUpperCase()));

  const digits = trimmed.replace(/\D/g, "");
  if (digits) {
    values.add(digits);
    if (digits.startsWith("09")) values.add(`+63${digits.slice(1)}`);
    if (digits.startsWith("639")) values.add(`+${digits}`);
  }

  return Array.from(values);
}

async function matchingSearchDocs({
  collection,
  search,
  status,
}: {
  collection: FirebaseFirestore.CollectionReference;
  search: string;
  status: string;
}) {
  const fields = [
    "reference",
    "packageTitle",
    "packageSlug",
    "groupContact.firstName",
    "groupContact.lastName",
    "groupContact.emailAddress",
    "groupContact.mobileNumber",
  ];
  const matches = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();

  await Promise.all(fields.flatMap((field) =>
    searchableValues(search).map(async (value) => {
      const bounds = prefixSearchBounds(value);
      if (!bounds) return;

      const query = collection.orderBy(field).startAt(bounds.start).endAt(bounds.end);
      const snapshot = await query.get();
      snapshot.docs.forEach((doc) => {
        if (!status || String(doc.data().status || "") === status) matches.set(doc.id, doc);
      });
    })
  ));

  return Array.from(matches.values()).sort((a, b) =>
    timestampValue(b.data().createdAt).localeCompare(timestampValue(a.data().createdAt))
  );
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();

  const { adminDb } = await import("@/lib/firebase-admin");
  const collection = adminDb.collection("bookings");
  const params = new URL(request.url).searchParams;
  const search = params.get("search")?.trim() ?? "";
  const status = params.get("status")?.trim() ?? "";
  const requestedPage = Math.max(1, Number(params.get("page") || 1));

  if (search) {
    const matches = await matchingSearchDocs({ collection, search, status });
    const start = (requestedPage - 1) * ADMIN_PAGE_SIZE;
    const docs = matches.slice(start, start + ADMIN_PAGE_SIZE);
    return NextResponse.json({
      bookings: docs.map((doc) => serializeBooking(doc.id, doc.data())),
      nextCursor: start + ADMIN_PAGE_SIZE < matches.length ? `page-${requestedPage + 1}` : "",
      hasNext: start + ADMIN_PAGE_SIZE < matches.length,
      total: matches.length,
      page: requestedPage,
      pageSize: ADMIN_PAGE_SIZE,
    });
  }

  const baseQuery = status ? collection.where("status", "==", status) : collection;
  const result = await paginatedDocs({
    query: baseQuery.orderBy("createdAt", "desc"),
    collection,
    cursor: pageCursor(request),
  });
  const bookings = result.docs.map((doc) => serializeBooking(doc.id, doc.data()));
  const totalSnapshot = await baseQuery.count().get();

  return NextResponse.json({
    bookings,
    nextCursor: result.nextCursor,
    hasNext: result.hasNext,
    total: totalSnapshot.data().count || 0,
    page: requestedPage,
    pageSize: ADMIN_PAGE_SIZE,
  });
}
