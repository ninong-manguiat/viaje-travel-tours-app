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
  const snapshot = await adminDb.collection("activityLogs").orderBy("createdAt", "desc").limit(limit).get();
  return snapshot.docs.map((doc) => serializeActivityLog(doc.id, doc.data()));
}
