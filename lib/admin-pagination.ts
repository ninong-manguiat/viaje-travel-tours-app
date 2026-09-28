import "server-only";

import type { CollectionReference, DocumentData, Query } from "firebase-admin/firestore";

export const ADMIN_PAGE_SIZE = 10;

export function pageCursor(request: Request) {
  return new URL(request.url).searchParams.get("cursor") || "";
}

export async function paginatedDocs<T extends DocumentData>({
  query,
  collection,
  cursor,
}: {
  query: Query<T>;
  collection: CollectionReference<T>;
  cursor?: string;
}) {
  let pageQuery = query;

  if (cursor) {
    const cursorSnapshot = await collection.doc(cursor).get();
    if (cursorSnapshot.exists) pageQuery = pageQuery.startAfter(cursorSnapshot);
  }

  const snapshot = await pageQuery.limit(ADMIN_PAGE_SIZE + 1).get();
  const docs = snapshot.docs.slice(0, ADMIN_PAGE_SIZE);

  return {
    docs,
    nextCursor: snapshot.docs.length > ADMIN_PAGE_SIZE ? docs.at(-1)?.id ?? "" : "",
    hasNext: snapshot.docs.length > ADMIN_PAGE_SIZE,
  };
}

export function prefixSearchBounds(value: string) {
  const normalized = value.trim();
  return normalized ? { start: normalized, end: `${normalized}\uf8ff` } : null;
}
