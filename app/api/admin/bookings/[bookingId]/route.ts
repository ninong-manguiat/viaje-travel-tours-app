import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { randomBytes } from "node:crypto";
import { isBookingDocumentType } from "@/lib/booking-documents";
import { serializeDocumentBin } from "@/lib/document-bins";
import { logActivity } from "@/lib/activity-log";
import { deleteFile } from "@/lib/storage";

const paymentStatuses = ["pending", "for_verification", "verified", "rejected", "paid", "partially_paid"];
const bookingStatuses = ["PENDING FOR VERIFICATION", "RESERVED", "CONFIRMED", "CANCELLED"];
const allowedContactFields = ["firstName", "middleName", "lastName", "emailAddress", "mobileNumber", "nationality"];
const allowedGuestFields = ["firstName", "middleName", "lastName", "birthdate", "nationality", "passportNumber", "isPwd"];

function normalizedStatus(value: unknown) {
  return String(value || "").toLowerCase();
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

function derivedPaymentStatus(schedule: Array<{ status?: string }>) {
  if (schedule.length && schedule.every((item) => ["verified", "paid"].includes(normalizedStatus(item.status)))) return "paid";
  if (schedule.some((item) => ["verified", "paid"].includes(normalizedStatus(item.status)))) return "partially_paid";
  if (schedule.some((item) => normalizedStatus(item.status) === "for_verification")) return "for_verification";
  return "pending";
}

function derivedBookingStatus(currentStatus: unknown, paymentSchedule: Array<{ id?: string; status?: string }>) {
  if (currentStatus === "CANCELLED") return "CANCELLED";

  const activeSchedule = paymentSchedule.filter((item) => !["cancelled", "deleted"].includes(normalizedStatus(item.status)));
  const hasVerifiedPayment = activeSchedule.some((item) => ["verified", "paid"].includes(normalizedStatus(item.status)));
  if (!hasVerifiedPayment) return "PENDING FOR VERIFICATION";

  const allActivePaymentsVerified = activeSchedule.length > 0 && activeSchedule.every((item) => ["verified", "paid"].includes(normalizedStatus(item.status)));
  return allActivePaymentsVerified ? "CONFIRMED" : "RESERVED";
}

function numberValue(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function paidFromSchedule(schedule: Array<{ amount?: number; status?: string }>) {
  return schedule.reduce((sum, item) => ["verified", "paid"].includes(normalizedStatus(item.status)) ? sum + numberValue(item.amount) : sum, 0);
}

function activeScheduleTotal(schedule: Array<{ amount?: number; status?: string }>) {
  return schedule.reduce((sum, item) => ["cancelled", "deleted"].includes(normalizedStatus(item.status)) ? sum : sum + numberValue(item.amount), 0);
}

function authoritativeTotal(booking: FirebaseFirestore.DocumentData, schedule: Array<{ amount?: number; status?: string }>) {
  return schedule.length ? activeScheduleTotal(schedule) : numberValue(booking.totalAmount ?? booking.bookingSelections?.finalAmount);
}

function documentToken() {
  return randomBytes(16).toString("base64url");
}

function cleanStringMap(input: unknown, allowedFields: string[]) {
  const source = input && typeof input === "object" ? input as Record<string, unknown> : {};
  return Object.fromEntries(
    allowedFields
      .filter((field) => field in source)
      .map((field) => [field, String(source[field] ?? "").trim()])
  );
}

function cleanGuest(input: unknown) {
  const source = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const guest = cleanStringMap(source, allowedGuestFields.filter((field) => field !== "isPwd"));
  if ("isPwd" in source) return { ...guest, isPwd: Boolean(source.isPwd) };
  return guest;
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
    currency: data.currency === "USD" ? "USD" : "PHP",
    createdAt: timestampValue(data.createdAt),
    updatedAt: timestampValue(data.updatedAt),
  };
}

function serializePaymentLog(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    bookingId: String(data.bookingId || ""),
    paymentScheduleId: String(data.paymentScheduleId || data.scheduleItemId || ""),
    paymentName: String(data.paymentName || data.label || ""),
    method: String(data.method || ""),
    referenceNumber: String(data.referenceNumber || ""),
    currency: data.currency === "USD" ? "USD" : "PHP",
    amountExpected: Number(data.amountExpected || 0),
    amountSubmitted: Number(data.amountSubmitted || 0),
    receiptUrl: String(data.receiptUrl || ""),
    paymentDate: String(data.paymentDate || ""),
    status: String(data.status || ""),
    createdAt: timestampValue(data.createdAt),
  };
}

async function deleteDocumentBinFiles(bin: ReturnType<typeof serializeDocumentBin>) {
  await Promise.all(bin.requirements.flatMap((requirement) =>
    requirement.uploads
      .filter((upload) => upload.storageKey)
      .map((upload) => deleteFile("travelDocuments", upload.storageKey))
  ));
}

export async function GET(request: NextRequest, { params }: { params: { bookingId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const { adminDb } = await import("@/lib/firebase-admin");
  const snapshot = await adminDb.collection("bookings").doc(params.bookingId).get();
  if (!snapshot.exists) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  const paymentSnapshot = await adminDb.collection("payments").where("bookingId", "==", params.bookingId).get();
  const paymentLogs = paymentSnapshot.docs.map((doc) => serializePaymentLog(doc.id, doc.data()));

  return NextResponse.json({ booking: { ...serializeBooking(snapshot.id, snapshot.data() ?? {}), paymentLogs } });
}

export async function PATCH(request: NextRequest, { params }: { params: { bookingId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const action = String(body?.action || "updateScheduleStatus");

  const { adminDb } = await import("@/lib/firebase-admin");
  const ref = adminDb.collection("bookings").doc(params.bookingId);
  const snapshot = await ref.get();

  if (!snapshot.exists) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const booking = snapshot.data() ?? {};
  const schedule = Array.isArray(booking.paymentSchedule) ? booking.paymentSchedule : [];

  if (action === "updateBookingStatus") {
    const status = String(body?.status || "");

    if (!bookingStatuses.includes(status)) return NextResponse.json({ error: "Invalid booking status" }, { status: 400 });
    if (status === "CONFIRMED" && derivedBookingStatus(booking.status, schedule) !== "CONFIRMED") {
      return NextResponse.json({ error: "Booking can only be confirmed when all active payment schedules are verified." }, { status: 400 });
    }

    await ref.set({ status, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await logActivity({
      type: "booking.status_updated",
      module: "bookings",
      entityType: "booking",
      entityId: params.bookingId,
      reference: String(booking.reference || params.bookingId),
      actorName: "Admin",
      description: `Admin updated booking ${String(booking.reference || params.bookingId)} to ${status}.`,
      href: `/admin/bookings?bookingId=${encodeURIComponent(params.bookingId)}`,
      metadata: { status },
    });
    return NextResponse.json({ status });
  }

  if (action === "updateScheduleStatus") {
    const scheduleItemId = String(body?.scheduleItemId || "");
    const status = String(body?.status || "");

    if (!scheduleItemId || !paymentStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid payment status update" }, { status: 400 });
    }

    const paymentSchedule = schedule.map((item) => item.id === scheduleItemId ? { ...item, status } : item);
    const paymentStatus = derivedPaymentStatus(paymentSchedule);
    const bookingStatus = derivedBookingStatus(booking.status, paymentSchedule);
    const totalAmount = authoritativeTotal(booking, paymentSchedule);
    const amountPaid = paidFromSchedule(paymentSchedule);

    await ref.set({
      paymentSchedule,
      totalAmount,
      paymentStatus,
      status: bookingStatus,
      amountPaid,
      balance: Math.max(0, totalAmount - amountPaid),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await logActivity({
      type: "booking.payment_schedule_updated",
      module: "bookings",
      entityType: "booking",
      entityId: params.bookingId,
      reference: String(booking.reference || params.bookingId),
      actorName: "Admin",
      description: `Admin updated a payment schedule item for ${String(booking.reference || params.bookingId)} to ${status.replace(/_/g, " ")}.`,
      href: `/admin/bookings?bookingId=${encodeURIComponent(params.bookingId)}`,
      metadata: { scheduleItemId, status },
    });
    return NextResponse.json({ paymentSchedule, totalAmount, paymentStatus, status: bookingStatus, amountPaid, balance: Math.max(0, totalAmount - amountPaid) });
  }

  if (action === "addPaymentSchedule") {
    const label = String(body?.label || "").trim();
    const amount = Number(body?.amount);
    const dueDate = String(body?.dueDate || "").slice(0, 10);
    const totalAmount = Number(booking.totalAmount ?? booking.bookingSelections?.finalAmount ?? 0);

    if (!label || !Number.isFinite(amount) || amount <= 0 || !dueDate) {
      return NextResponse.json({ error: "Payment name, amount, and due date are required." }, { status: 400 });
    }

    const scheduleItem = { id: `custom-${Date.now()}`, label, amount, dueDate, status: "pending" };
    const paymentSchedule = [...schedule, scheduleItem];
    const amountPaid = paidFromSchedule(paymentSchedule);
    const authoritativeTotalAmount = authoritativeTotal(booking, paymentSchedule) || totalAmount;
    const paymentStatus = derivedPaymentStatus(paymentSchedule);
    const bookingStatus = derivedBookingStatus(booking.status, paymentSchedule);
    const paymentLog = {
      id: `pay-${params.bookingId}-${scheduleItem.id}`,
      transactionId: "",
      bookingId: params.bookingId,
      bookingReference: String(booking.reference || params.bookingId),
      clientId: null,
      source: "BOOKING",
      paymentName: scheduleItem.label,
      paymentScheduleId: scheduleItem.id,
      method: "",
      paymentMethodReferenceNumber: "",
      referenceNumber: "",
      amountExpected: scheduleItem.amount,
      amountSubmitted: 0,
      receiptUrl: "",
      paymentDate: "",
      notes: "",
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await ref.set({
      paymentSchedule,
      totalAmount: authoritativeTotalAmount,
      paymentStatus,
      status: bookingStatus,
      amountPaid,
      balance: Math.max(0, authoritativeTotalAmount - amountPaid),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await adminDb.collection("payments").doc(paymentLog.id).set(paymentLog, { merge: true });
    return NextResponse.json({
      paymentSchedule,
      totalAmount: authoritativeTotalAmount,
      paymentStatus,
      status: bookingStatus,
      amountPaid,
      balance: Math.max(0, authoritativeTotalAmount - amountPaid),
      paymentLog: { ...paymentLog, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    });
  }

  if (action === "updateContactGuests") {
    const currentGuests = Array.isArray(booking.guests) ? booking.guests : [];
    const incomingGuests = Array.isArray(body.guests) ? body.guests : [];

    if (incomingGuests.length !== currentGuests.length) {
      return NextResponse.json({ error: "Guest count cannot be changed from Booking Details." }, { status: 400 });
    }

    const groupContact = {
      ...(booking.groupContact && typeof booking.groupContact === "object" ? booking.groupContact : {}),
      ...cleanStringMap(body.groupContact, allowedContactFields),
    };
    const guests = currentGuests.map((guest, index) => ({
      ...(guest && typeof guest === "object" ? guest : {}),
      ...cleanGuest(incomingGuests[index]),
    }));

    await ref.set({ groupContact, guests, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ groupContact, guests });
  }

  if (action === "addDocumentRequirement") {
    const type = String(body?.type || "");
    const documents = Array.isArray(booking.documentRequirements) ? booking.documentRequirements : [];

    if (!isBookingDocumentType(type)) return NextResponse.json({ error: "Invalid document type." }, { status: 400 });
    if (documents.some((item) => item.type === type)) {
      return NextResponse.json({ error: "Document requirement already exists." }, { status: 400 });
    }

    const documentRequirements = [
      ...documents,
      { id: `doc-${Date.now()}`, type, status: "PENDING", requestedAt: new Date().toISOString() },
    ];
    const token = booking.documentToken || documentToken();

    await ref.set({ documentRequirements, documentToken: token, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ documentRequirements, documentToken: token });
  }

  if (action === "ensureDocumentToken") {
    const token = booking.documentToken || documentToken();
    await ref.set({ documentToken: token, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ documentToken: token, documentRequirements: booking.documentRequirements ?? [] });
  }

  if (action === "unlinkDocumentBin") {
    const documentBinId = String(booking.documentBinId || "");
    if (!documentBinId) return NextResponse.json({ error: "This booking does not have a linked document bin." }, { status: 400 });

    const binRef = adminDb.collection("documentBins").doc(documentBinId);
    const binSnapshot = await binRef.get();

    if (binSnapshot.exists) {
      const bin = serializeDocumentBin(binSnapshot.id, binSnapshot.data() ?? {});
      if (bin.bookingId && bin.bookingId !== params.bookingId) {
        return NextResponse.json({ error: "Linked document bin belongs to a different booking." }, { status: 409 });
      }

      try {
        await deleteDocumentBinFiles(bin);
      } catch {
        return NextResponse.json({ error: "Unable to delete one or more uploaded files. Document bin was not unlinked." }, { status: 500 });
      }

      await binRef.delete();
    }

    await ref.set({
      documentBinId: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ documentBinId: "" });
  }

  return NextResponse.json({ error: "Unsupported booking update." }, { status: 400 });
}
