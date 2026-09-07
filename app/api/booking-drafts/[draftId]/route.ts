import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getPackageById } from "@/lib/package-data";

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

async function draftRef(draftId: string) {
  const { adminDb } = await import("@/lib/firebase-admin");
  return adminDb.collection("bookingDrafts").doc(draftId);
}

export async function GET(_request: NextRequest, { params }: { params: { draftId: string } }) {
  const snapshot = await (await draftRef(params.draftId)).get();

  if (!snapshot.exists) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  const data = snapshot.data() ?? {};
  return NextResponse.json({ draft: { ...data, id: params.draftId } });
}

export async function PATCH(request: NextRequest, { params }: { params: { draftId: string } }) {
  const ref = await draftRef(params.draftId);
  const snapshot = await ref.get();

  if (!snapshot.exists) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  const current = snapshot.data() ?? {};
  if (current.status !== "draft") {
    return NextResponse.json({ error: "Draft cannot be updated" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const packageId = String(body?.packageId || current.packageId || "");
  const pkg = await getPackageById(packageId);

  if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  const selectedDeparture = pkg.travelDates.find((item) => item.id === body?.departureId) ?? pkg.travelDates[0] ?? null;
  const selectedAddon = pkg.addons.find((item) => item.id === body?.addonId) ?? null;
  const pax = Math.max(1, Math.floor(numberValue(body?.pax, current.pax || 1)));
  const baseAmount = pkg.price;
  const departureAdditionalAmount = selectedDeparture?.additionalAmount ?? 0;
  const addonAmount = selectedAddon?.price ?? 0;
  const finalAmount = (baseAmount + departureAdditionalAmount + addonAmount) * pax;

  const draft = {
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
    paymentMethodId: body?.paymentMethodId ?? "gcash",
    paymentProofUrl: body?.paymentProofUrl ?? "",
    paymentReference: body?.paymentReference ?? "",
    currentStep: body?.currentStep === "payment" ? "payment" : "guests",
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(draft, { merge: true });

  return NextResponse.json({ draft: { ...draft, id: params.draftId, updatedAt: new Date().toISOString() } });
}
