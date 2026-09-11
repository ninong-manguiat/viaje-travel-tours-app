import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { randomBytes } from "node:crypto";
import { isBookingDocumentType } from "@/lib/booking-documents";
import { serializeDocumentBin } from "@/lib/document-bins";
import { deleteFile } from "@/lib/storage";

const paymentStatuses = ["pending", "for_verification", "verified", "rejected", "paid", "partially_paid"];
const bookingStatuses = ["PENDING FOR VERIFICATION", "CONFIRMED", "CANCELLED"];
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

  const initialPayment = paymentSchedule.find((item) => item.id === "downpayment") ?? paymentSchedule.find((item) => item.id === "full-payment");
  if (initialPayment && ["verified", "paid"].includes(normalizedStatus(initialPayment.status))) return "CONFIRMED";

  return currentStatus === "CONFIRMED" ? "CONFIRMED" : "PENDING FOR VERIFICATION";
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
    createdAt: timestampValue(data.createdAt),
    updatedAt: timestampValue(data.updatedAt),
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

  return NextResponse.json({ booking: serializeBooking(snapshot.id, snapshot.data() ?? {}) });
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

    await ref.set({ status, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
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

    await ref.set({ paymentSchedule, paymentStatus, status: bookingStatus, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ paymentSchedule, paymentStatus, status: bookingStatus });
  }

  if (action === "addPaymentSchedule") {
    const label = String(body?.label || "").trim();
    const amount = Number(body?.amount);
    const dueDate = String(body?.dueDate || "").slice(0, 10);
    const totalAmount = Number(booking.totalAmount ?? booking.bookingSelections?.finalAmount ?? 0);
    const allocatedAmount = schedule.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    if (!label || !Number.isFinite(amount) || amount <= 0 || !dueDate) {
      return NextResponse.json({ error: "Payment name, amount, and due date are required." }, { status: 400 });
    }

    const overage = allocatedAmount + amount - totalAmount;
    const remainingBalanceItem = schedule.find((item) => item.id === "remaining-balance");

    if (overage > 0 && (!remainingBalanceItem || Number(remainingBalanceItem.amount || 0) < overage)) {
      return NextResponse.json({ error: "Payment schedule cannot exceed the total booking amount." }, { status: 400 });
    }

    const adjustedSchedule = overage > 0
      ? schedule.map((item) => item.id === "remaining-balance" ? { ...item, amount: Number(item.amount || 0) - overage } : item)
      : schedule;
    const paymentSchedule = [...adjustedSchedule, { id: `custom-${Date.now()}`, label, amount, dueDate, status: "pending" }];
    await ref.set({ paymentSchedule, paymentStatus: derivedPaymentStatus(paymentSchedule), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ paymentSchedule });
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
