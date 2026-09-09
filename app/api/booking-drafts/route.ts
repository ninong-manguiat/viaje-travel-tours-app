import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getPackageById } from "@/lib/package-data";

function draftId() {
  return randomBytes(16).toString("base64url");
}

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const packageId = String(body?.packageId || "");
  const pkg = await getPackageById(packageId);

  if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  const requestedDeparture = pkg.travelDates.find((item) => item.id === body?.departureId) ?? null;
  const selectedDeparture = requestedDeparture ?? pkg.travelDates.find((item) => item.availabilityStatus !== "sold_out") ?? null;
  if (requestedDeparture?.availabilityStatus === "sold_out" || (pkg.travelDates.length > 0 && !selectedDeparture)) {
    return NextResponse.json({ error: "Selected departure is sold out" }, { status: 400 });
  }
  const selectedAddon = pkg.addons.find((item) => item.id === body?.addonId) ?? null;
  const pax = Math.max(1, Math.floor(numberValue(body?.pax, 1)));
  const baseAmount = pkg.price;
  const departureAdditionalAmount = selectedDeparture?.additionalAmount ?? 0;
  const addonAmount = selectedAddon?.price ?? 0;
  const finalAmount = (baseAmount + departureAdditionalAmount + addonAmount) * pax;
  const id = draftId();
  const { adminDb } = await import("@/lib/firebase-admin");

  const draft = {
    id,
    status: "draft",
    packageId: pkg.id,
    packageSlug: pkg.slug,
    departureId: selectedDeparture?.id ?? "",
    addonId: selectedAddon?.id ?? "none",
    pax,
    pricing: {
      baseAmount,
      departureAdditionalAmount,
      addonAmount,
      finalAmount,
    },
    guests: Array.isArray(body?.guests) ? body.guests : [],
    groupContact: body?.groupContact ?? {},
    useGuestOne: Boolean(body?.useGuestOne),
    paymentMethodId: body?.paymentMethodId ?? "",
    paymentMethodReferenceNumber: body?.paymentMethodReferenceNumber ?? "",
    paymentOption: body?.paymentOption === "downpayment_50" ? "downpayment_50" : "full",
    paymentSchedule: Array.isArray(body?.paymentSchedule) ? body.paymentSchedule : [],
    paymentProofUrl: body?.paymentProofUrl ?? "",
    paymentReference: body?.paymentReference ?? "",
    currentStep: body?.currentStep === "payment" ? "payment" : "guests",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await adminDb.collection("bookingDrafts").doc(id).set(draft);

  return NextResponse.json({ draft: { ...draft, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } });
}
