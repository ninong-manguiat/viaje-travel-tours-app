import "server-only";

import { recentActivityLogs, type ActivityLog } from "@/lib/activity-log";

export type DashboardStatusCount = {
  status: string;
  count: number;
};

export type DashboardModuleSummary = {
  key: "bookings" | "payments" | "quotations" | "documents";
  title: string;
  description: string;
  href: string;
  total: number;
  statuses: DashboardStatusCount[];
};

const moduleConfigs = [
  {
    key: "bookings",
    title: "Booking Logs",
    description: "Customer bookings and verification progress",
    collection: "bookings",
    href: "/admin/bookings",
    statuses: ["PENDING FOR VERIFICATION", "CONFIRMED", "CANCELLED"],
  },
  {
    key: "payments",
    title: "Payments Logs",
    description: "Payment submissions and review statuses",
    collection: "payments",
    href: "/admin/payments/verification",
    statuses: ["for_verification", "verified", "rejected"],
  },
  {
    key: "quotations",
    title: "Quotations Logs",
    description: "Quotation builder records and finalization",
    collection: "quotations",
    href: "/admin/quotations",
    statuses: ["DRAFT", "FINALIZED"],
  },
  {
    key: "documents",
    title: "Documents Logs",
    description: "Document bins and client submissions",
    collection: "documentBins",
    href: "/admin/documents",
    statuses: ["ACTIVE", "COMPLETED", "CANCELLED"],
  },
] as const;

async function countQuery(query: FirebaseFirestore.Query) {
  const snapshot = await query.count().get();
  return snapshot.data().count || 0;
}

async function moduleSummary(config: typeof moduleConfigs[number]): Promise<DashboardModuleSummary> {
  const { adminDb } = await import("@/lib/firebase-admin");
  const collection = adminDb.collection(config.collection);
  const [total, ...statusCounts] = await Promise.all([
    countQuery(collection),
    ...config.statuses.map((status) => countQuery(collection.where("status", "==", status))),
  ]);

  return {
    key: config.key,
    title: config.title,
    description: config.description,
    href: config.href,
    total,
    statuses: config.statuses.map((status, index) => ({ status, count: statusCounts[index] || 0 })),
  };
}

export async function getAdminDashboardData(): Promise<{
  modules: DashboardModuleSummary[];
  activities: ActivityLog[];
}> {
  const [modules, activities] = await Promise.all([
    Promise.all(moduleConfigs.map(moduleSummary)),
    recentActivityLogs(10),
  ]);

  return { modules, activities };
}
