import { defaultAirlines, normalizeAirline } from "@/lib/airlines";

export async function ensureDefaultAirlines() {
  const { adminDb } = await import("@/lib/firebase-admin");
  const collection = adminDb.collection("airlines");
  const batch = adminDb.batch();
  let hasMissingDefault = false;
  const snapshots = await Promise.all(defaultAirlines.map((airline) => collection.doc(airline.id).get()));

  defaultAirlines.forEach((airline) => {
    const exists = snapshots.some((snapshot) => snapshot.id === airline.id && snapshot.exists);
    if (exists) return;

    hasMissingDefault = true;
    batch.set(collection.doc(airline.id), airline);
  });

  if (hasMissingDefault) await batch.commit();
}

export async function listAirlines() {
  await ensureDefaultAirlines();
  const { adminDb } = await import("@/lib/firebase-admin");
  const snapshot = await adminDb.collection("airlines").orderBy("name").get();
  return snapshot.docs.map((doc) => normalizeAirline({ id: doc.id, ...doc.data() }));
}
