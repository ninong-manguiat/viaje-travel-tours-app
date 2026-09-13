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

function dateOnly(value?: string) {
  return value ? value.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function normalizeContactNumber(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("630")) return `+63${digits.slice(3, 13)}`;
  if (digits.startsWith("63")) return `+${digits.slice(0, 12)}`;
  if (digits.startsWith("0")) return `+63${digits.slice(1, 11)}`;
  return `+63${digits.slice(0, 10)}`;
}

function isValidContactNumber(value: unknown) {
  return /^\+639\d{9}$/.test(normalizeContactNumber(value));
}

function isValidEmail(value: unknown) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function paymentAmounts(finalAmount: number, paymentOption: string) {
  if (paymentOption !== "downpayment_50") return { amountSubmitted: finalAmount, remainingBalance: 0 };

  const amountSubmitted = Math.floor(finalAmount / 2);
  return { amountSubmitted, remainingBalance: finalAmount - amountSubmitted };
}

function paymentSchedule(finalAmount: number, paymentOption: string, departureDate?: string) {
  const currentDate = dateOnly();

  if (paymentOption !== "downpayment_50") {
    return [{ id: "full-payment", label: "Full Payment", amount: finalAmount, dueDate: currentDate, status: "for_verification" }];
  }

  const amounts = paymentAmounts(finalAmount, paymentOption);
  return [
    { id: "downpayment", label: "Downpayment", amount: amounts.amountSubmitted, dueDate: currentDate, status: "for_verification" },
    { id: "remaining-balance", label: "Remaining Balance", amount: amounts.remainingBalance, dueDate: dateOnly(departureDate), status: "pending" },
  ];
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const draftId = String(body?.draftId || "");
  const packageId = String(body?.packageId || "");
  const pkg = await getPackageById(packageId);

  if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  const requestedDeparture = pkg.travelDates.find((item) => item.id === body?.departureId) ?? null;
  const selectedDeparture = requestedDeparture ?? pkg.travelDates.find((item) => item.availabilityStatus !== "sold_out") ?? null;
  if (requestedDeparture?.availabilityStatus === "sold_out" || (pkg.travelDates.length > 0 && !selectedDeparture)) {
    return NextResponse.json({ error: "Selected departure is sold out" }, { status: 400 });
  }
  const selectedAddon = pkg.addons.find((item) => item.id === body?.addonId) ?? null;
  const pax = Math.max(1, Math.floor(numberValue(body?.pax) || 1));
  const baseAmount = pkg.price;
  const departureAdditionalAmount = selectedDeparture?.additionalAmount ?? 0;
  const addonAmount = selectedAddon?.price ?? 0;
  const finalAmount = (baseAmount + departureAdditionalAmount + addonAmount) * pax;
  const requestedPaymentOption = body?.payment?.paymentOption === "downpayment_50" ? "downpayment_50" : "full";
  const paymentOption = requestedPaymentOption;
  const { amountSubmitted, remainingBalance } = paymentAmounts(finalAmount, paymentOption);
  const schedule = paymentSchedule(finalAmount, paymentOption, selectedDeparture?.startDate);
  const groupContact = body?.groupContact ?? {};
  if (!String(groupContact.firstName || "").trim() || !String(groupContact.lastName || "").trim()) {
    return NextResponse.json({ error: "Group contact name is required" }, { status: 400 });
  }
  if (!isValidContactNumber(groupContact.mobileNumber)) {
    return NextResponse.json({ error: "Group contact mobile number must be a valid +63 mobile number" }, { status: 400 });
  }
  if (!isValidEmail(groupContact.emailAddress)) {
    return NextResponse.json({ error: "Group contact email address must be valid" }, { status: 400 });
  }
  const normalizedGroupContact = {
    ...groupContact,
    mobileNumber: normalizeContactNumber(groupContact.mobileNumber),
    emailAddress: String(groupContact.emailAddress || "").trim(),
  };
  const bookingId = `booking-${Date.now()}`;
  const transactionId = `txn-${Date.now()}`;
  const paymentId = `pay-${Date.now()}`;
  const reference = referenceNumber();
  const { adminDb } = await import("@/lib/firebase-admin");
  const draftRef = draftId ? adminDb.collection("bookingDrafts").doc(draftId) : null;

  if (draftRef) {
    const lockResult = await adminDb.runTransaction(async (transaction) => {
      const draftSnapshot = await transaction.get(draftRef);

      if (!draftSnapshot.exists) return "not_found";
      if (draftSnapshot.data()?.status !== "draft") return "already_submitted";

      transaction.set(draftRef, { status: "submitting", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return "locked";
    });

    if (lockResult === "not_found") return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    if (lockResult === "already_submitted") return NextResponse.json({ error: "Draft already submitted" }, { status: 409 });
  }

  const booking = {
    id: bookingId,
    reference,
    clientId: null,
    packageId: pkg.id,
    packageSlug: pkg.slug,
    packageTitle: pkg.title,
    departureId: selectedDeparture?.id ?? "",
    addonId: selectedAddon?.id ?? "none",
    status: "PENDING FOR VERIFICATION",
    paymentStatus: "for_verification",
    totalAmount: finalAmount,
    amountPaid: amountSubmitted,
    balance: remainingBalance,
    source: "website",
    guests: body?.guests ?? [],
    groupContact: normalizedGroupContact,
    paymentOption,
    paymentType: paymentOption === "downpayment_50" ? "50% Downpayment" : "Full Payment",
    paymentInfo: {
      method: body?.payment?.method ?? "",
      transactionReferenceNumber: body?.payment?.referenceNumber ?? "",
      paymentMethodReferenceNumber: body?.payment?.paymentMethodReferenceNumber ?? "",
      receiptUrl: body?.payment?.receiptUrl ?? "",
      amountSubmitted,
      paymentDate: body?.payment?.paymentDate ?? new Date().toISOString().slice(0, 10),
    },
    paymentSchedule: schedule,
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
    type: paymentOption === "downpayment_50" ? "deposit" : "full",
    amount: amountSubmitted,
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
    paymentMethodReferenceNumber: body?.payment?.paymentMethodReferenceNumber ?? "",
    referenceNumber: body?.payment?.referenceNumber ?? "",
    amountExpected: amountSubmitted,
    amountSubmitted,
    receiptUrl: body?.payment?.receiptUrl ?? "",
    paymentDate: body?.payment?.paymentDate ?? new Date().toISOString().slice(0, 10),
    notes: body?.payment?.notes ?? "",
    status: "for_verification",
    createdAt: FieldValue.serverTimestamp(),
  };

  let finalRecordsCreated = false;

  try {
    await adminDb.collection("bookings").doc(bookingId).set(booking);
    await adminDb.collection("transactions").doc(transactionId).set(transaction);
    await adminDb.collection("payments").doc(paymentId).set(payment);
    finalRecordsCreated = true;
    if (draftRef) await draftRef.delete();
  } catch (error) {
    if (draftRef && !finalRecordsCreated) {
      await draftRef.set({ status: "draft", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    throw error;
  }

  return NextResponse.json({ booking: { ...booking, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, transaction, payment });
}
