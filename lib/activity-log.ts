import "server-only";

import { FieldValue } from "firebase-admin/firestore";

export type ActivityModule = "bookings" | "payments" | "quotations" | "documents";

export type ActivityLogInput = {
  type: string;
  module: ActivityModule;
  entityType: string;
  entityId: string;
  reference?: string;
  actorName?: string;
  description: string;
  href: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type ActivityLog = ActivityLogInput & {
  id: string;
  createdAt: string;
};

const activityEntityCollections = {
  booking: "bookings",
  payment: "payments",
  quotation: "quotations",
  documentBin: "documentBins",
} as const;

const RECENT_ACTIVITY_SCAN_LIMIT = 25;

function timestampValue(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value && typeof value === "object" && "seconds" in value && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000).toISOString();
  }

  return typeof value === "string" ? value : "";
}

export function serializeActivityLog(id: string, data: FirebaseFirestore.DocumentData): ActivityLog {
  return {
    id,
    type: String(data.type || ""),
    module: ["bookings", "payments", "quotations", "documents"].includes(String(data.module))
      ? data.module
      : "bookings",
    entityType: String(data.entityType || ""),
    entityId: String(data.entityId || ""),
    reference: String(data.reference || ""),
    actorName: String(data.actorName || ""),
    description: String(data.description || ""),
    href: String(data.href || "/admin"),
    metadata: data.metadata && typeof data.metadata === "object" ? data.metadata : {},
    createdAt: timestampValue(data.createdAt),
  };
}

export async function logActivity(input: ActivityLogInput) {
  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    await adminDb.collection("activityLogs").doc().set({
      ...input,
      reference: input.reference || "",
      actorName: input.actorName || "",
      metadata: input.metadata || {},
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("[activity-log] Unable to write activity log", error);
  }
}

export async function recentActivityLogs(limit = 10) {
  const { adminDb } = await import("@/lib/firebase-admin");
  const snapshot = await adminDb.collection("activityLogs")
    .orderBy("createdAt", "desc")
    .limit(Math.max(limit, RECENT_ACTIVITY_SCAN_LIMIT))
    .get();
  const activities = snapshot.docs.map((doc) => serializeActivityLog(doc.id, doc.data()));
  const entityRefs = new Map<string, FirebaseFirestore.DocumentReference>();

  for (const activity of activities) {
    const collection = activityEntityCollections[activity.entityType as keyof typeof activityEntityCollections];
    if (collection && activity.entityId) {
      const ref = adminDb.collection(collection).doc(activity.entityId);
      entityRefs.set(ref.path, ref);
    }
  }

  const entitySnapshots = entityRefs.size ? await adminDb.getAll(...entityRefs.values()) : [];
  const existingEntityPaths = new Set(entitySnapshots.filter((item) => item.exists).map((item) => item.ref.path));

  return activities
    .filter((activity) => {
      const collection = activityEntityCollections[activity.entityType as keyof typeof activityEntityCollections];
      return Boolean(collection && activity.entityId && existingEntityPaths.has(`${collection}/${activity.entityId}`));
    })
    .slice(0, limit);
}
