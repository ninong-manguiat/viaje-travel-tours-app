import "server-only";

import { randomBytes } from "crypto";
import type { FieldValue, Timestamp } from "firebase-admin/firestore";

export const quotationItemTypes = [
  "Flight Fee",
  "Hotel Accommodation",
  "Boat Tickets",
  "PSA Assistance",
  "Car Rentals",
  "Taxes & Processing",
  "Other",
] as const;

export type QuotationItemType = typeof quotationItemTypes[number];
export type QuotationStatus = "DRAFT" | "FINALIZED";
export type QuotationPaymentStatus = "UNPAID" | "PENDING FOR VERIFICATION" | "VERIFIED" | "REJECTED";

export type QuotationItem = {
  id: string;
  quotationId: string;
  type: QuotationItemType;
  customName: string;
  itemName: string;
  remarks: string;
  amount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Quotation = {
  id: string;
  referenceNumber: string;
  publicToken: string;
  clientName: string;
  email: string;
  contactNumber: string;
  status: QuotationStatus;
  totalAmount: number;
  paymentToken: string;
  paymentStatus: QuotationPaymentStatus;
  latestPaymentId: string;
  createdAt: string;
  updatedAt: string;
  finalizedAt: string;
  items: QuotationItem[];
};

type MaybeTimestamp = Timestamp | FieldValue | Date | string | null | undefined;

export function secureToken() {
  return randomBytes(24).toString("hex");
}

export function newQuotationId() {
  return `quotation-${Date.now()}`;
}

export function newQuotationItem(quotationId = "", sortOrder = 0): QuotationItem {
  const now = new Date().toISOString();
  return {
    id: `qitem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    quotationId,
    type: "Flight Fee",
    customName: "",
    itemName: "Flight Fee",
    remarks: "",
    amount: 0,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  };
}

export function displayItemName(item: Pick<QuotationItem, "type" | "customName">) {
  return item.type === "Other" ? item.customName.trim() || "Other" : item.type;
}

export function normalizeAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

export function totalQuotationItems(items: Array<Pick<QuotationItem, "amount">>) {
  return items.reduce((sum, item) => sum + normalizeAmount(item.amount), 0);
}

function serializeDate(value: MaybeTimestamp) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if ("toDate" in Object(value) && typeof (value as Timestamp).toDate === "function") return (value as Timestamp).toDate().toISOString();
  return "";
}

export function normalizeQuotationItem(id: string, data: Record<string, unknown>, quotationId = ""): QuotationItem {
  const type = quotationItemTypes.includes(data.type as QuotationItemType) ? data.type as QuotationItemType : "Other";
  const item = {
    id,
    quotationId: String(data.quotationId || quotationId),
    type,
    customName: String(data.customName || "").trim(),
    itemName: String(data.itemName || "").trim(),
    remarks: String(data.remarks || "").trim(),
    amount: normalizeAmount(data.amount),
    sortOrder: Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : 0,
    createdAt: serializeDate(data.createdAt as MaybeTimestamp),
    updatedAt: serializeDate(data.updatedAt as MaybeTimestamp),
  };
  return { ...item, itemName: item.itemName || displayItemName(item) };
}

export function normalizeQuotation(id: string, data: Record<string, unknown>, items: QuotationItem[] = []): Quotation {
  const status = data.status === "FINALIZED" ? "FINALIZED" : "DRAFT";
  const paymentStatus = ["PENDING FOR VERIFICATION", "VERIFIED", "REJECTED"].includes(String(data.paymentStatus))
    ? data.paymentStatus as QuotationPaymentStatus
    : "UNPAID";

  return {
    id,
    referenceNumber: String(data.referenceNumber || ""),
    publicToken: String(data.publicToken || ""),
    clientName: String(data.clientName || "").trim(),
    email: String(data.email || "").trim(),
    contactNumber: String(data.contactNumber || "").trim(),
    status,
    totalAmount: normalizeAmount(data.totalAmount),
    paymentToken: String(data.paymentToken || ""),
    paymentStatus,
    latestPaymentId: String(data.latestPaymentId || ""),
    createdAt: serializeDate(data.createdAt as MaybeTimestamp),
    updatedAt: serializeDate(data.updatedAt as MaybeTimestamp),
    finalizedAt: serializeDate(data.finalizedAt as MaybeTimestamp),
    items,
  };
}

export async function nextQuotationReference() {
  const { adminDb } = await import("@/lib/firebase-admin");
  const year = new Date().getFullYear();
  const prefix = `VQ-${year}-`;
  const snapshot = await adminDb.collection("quotations")
    .where("referenceNumber", ">=", prefix)
    .where("referenceNumber", "<", `${prefix}\uf8ff`)
    .orderBy("referenceNumber", "desc")
    .limit(1)
    .get();
  const last = snapshot.docs[0]?.data()?.referenceNumber;
  const current = typeof last === "string" ? Number(last.split("-").pop()) : 0;
  return `${prefix}${String((Number.isFinite(current) ? current : 0) + 1).padStart(4, "0")}`;
}

export async function getQuotationWithItems(quotationId: string) {
  const { adminDb } = await import("@/lib/firebase-admin");
  const doc = await adminDb.collection("quotations").doc(quotationId).get();
  if (!doc.exists) return null;
  const itemSnapshot = await adminDb.collection("quotationItems").where("quotationId", "==", quotationId).get();
  const items = itemSnapshot.docs
    .map((itemDoc) => normalizeQuotationItem(itemDoc.id, itemDoc.data(), quotationId))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return normalizeQuotation(doc.id, doc.data() ?? {}, items);
}

export async function getQuotationByToken(field: "publicToken" | "paymentToken", token: string) {
  const { adminDb } = await import("@/lib/firebase-admin");
  const snapshot = await adminDb.collection("quotations").where(field, "==", token).limit(1).get();
  const doc = snapshot.docs[0];
  if (!doc) return null;
  return getQuotationWithItems(doc.id);
}
