import { normalizePackage } from "@/lib/package-content";
import type { TravelPackage } from "@/lib/types";

async function collectionRef() {
  const { adminDb } = await import("@/lib/firebase-admin");
  return adminDb.collection("packages");
}

export async function listPackages(): Promise<TravelPackage[]> {
  const snapshot = await (await collectionRef()).orderBy("title").get();
  return snapshot.docs.map((doc) => normalizePackage({ id: doc.id, ...doc.data() }));
}

export async function getPackageById(packageId: string): Promise<TravelPackage | null> {
  const collection = await collectionRef();
  const snapshot = await collection.doc(packageId).get();
  if (snapshot.exists) return normalizePackage({ id: snapshot.id, ...snapshot.data() });

  const slugSnapshot = await collection.where("slug", "==", packageId).limit(1).get();
  if (slugSnapshot.empty) return null;

  const doc = slugSnapshot.docs[0];
  return normalizePackage({ id: doc.id, ...doc.data() });
}
