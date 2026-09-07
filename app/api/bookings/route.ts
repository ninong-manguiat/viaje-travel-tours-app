import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getPackageById } from "@/lib/package-data";

function referenceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const stamp = `${date.getTime()}`.slice(-6);
  return `VJ-${year}-${stamp}`;
}

function numberValue(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const draftId = String(body?.draftId || "");
  const packageId = String(body?.packageId || "");
  const pkg = await getPackageById(packageId);

  if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  const selectedDeparture = pkg.travelDates.find((item) => item.id === body?.departureId) ?? pkg.travelDates[0] ?? null;
  const selectedAddon = pkg.addons.find((item) => item.id === body?.addonId) ?? null;
  const pax = Math.max(1, Math.floor(numberValue(body?.pax) || 1));
  const baseAmount = pkg.price;
  const departureAdditionalAmount = selectedDeparture?.additionalAmount ?? 0;
  const addonAmount = selectedAddon?.price ?? 0;
  const finalAmount = (baseAmount + departureAdditionalAmount + addonAmount) * pax;
  const bookingId = `booking-${Date.now()}`;
  const transactionId = `txn-${Date.now()}`;
  const paymentId = `pay-${Date.now()}`;
  const reference = referenceNumber();
  const { adminDb } = await import("@/lib/firebase-admin");
  const draftRef = draftId ? adminDb.collection("bookingDrafts").doc(draftId) : null;

  if (draftRef) {
    const draftSnapshot = await draftRef.get();

    if (!draftSnapshot.exists) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    if (draftSnapshot.data()?.status !== "draft") {
      return NextResponse.json({ error: "Draft already submitted" }, { status: 409 });
    }

    await draftRef.set({ status: "submitting", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }

  const booking = {
    id: bookingId,
    reference,
    clientId: null,
    packageId: pkg.id,
    packageSlug: pkg.slug,
    departureId: selectedDeparture?.id ?? "",
    addonId: selectedAddon?.id ?? "none",
    status: "PENDING FOR VERIFICATION",
    paymentStatus: "for_verification",
    totalAmount: finalAmount,
    amountPaid: finalAmount,
    balance: 0,
    source: "website",
    guests: body?.guests ?? [],
    groupContact: body?.groupContact ?? {},
    bookingSelections: {
      pax,
      baseAmount,
      departureAdditionalAmount,
      addonAmount,
      finalAmount,
      selectedDeparture,
      selectedAddon,
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const transaction = {
    id: transactionId,
    bookingId,
    clientId: null,
    type: "full",
    amount: finalAmount,
    dueDate: new Date().toISOString(),
    status: "for_verification",
    createdAt: FieldValue.serverTimestamp(),
  };

  const payment = {
    id: paymentId,
    transactionId,
    bookingId,
    clientId: null,
    method: body?.payment?.method ?? "",
    referenceNumber: body?.payment?.referenceNumber ?? "",
    amountExpected: finalAmount,
    amountSubmitted: numberValue(body?.payment?.amountSubmitted) || finalAmount,
    receiptUrl: body?.payment?.receiptUrl ?? "",
    paymentDate: body?.payment?.paymentDate ?? new Date().toISOString().slice(0, 10),
    notes: body?.payment?.notes ?? "",
    status: "for_verification",
    createdAt: FieldValue.serverTimestamp(),
  };

  try {
    await adminDb.collection("bookings").doc(bookingId).set(booking);
    await adminDb.collection("transactions").doc(transactionId).set(transaction);
    await adminDb.collection("payments").doc(paymentId).set(payment);
    if (draftRef) await draftRef.delete();
  } catch (error) {
    if (draftRef) {
      await draftRef.set({ status: "draft", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    throw error;
  }

  return NextResponse.json({ booking: { ...booking, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, transaction, payment });
}
