import { notFound } from "next/navigation";
import { GuestCheckoutClient, type GuestCheckoutDraft } from "@/components/domain/guest-checkout-client";
import { getPackageById } from "@/lib/package-data";

export const dynamic = "force-dynamic";

function draftString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function draftNumber(value: unknown, fallback = 1) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export default async function GuestCheckoutDraftPage({
  params,
  searchParams,
}: {
  params: { draftId: string };
  searchParams: { step?: string };
}) {
  const { adminDb } = await import("@/lib/firebase-admin");
  const snapshot = await adminDb.collection("bookingDrafts").doc(params.draftId).get();

  if (!snapshot.exists) notFound();

  const data = snapshot.data() ?? {};
  if (data.status !== "draft" && data.status !== "completed") notFound();

  const pkg = await getPackageById(draftString(data.packageId || data.packageSlug));
  if (!pkg) notFound();

  const draft: GuestCheckoutDraft = {
    id: params.draftId,
    status: data.status,
    packageId: draftString(data.packageId),
    packageSlug: draftString(data.packageSlug),
    departureId: draftString(data.departureId),
    addonId: draftString(data.addonId || "none"),
    pax: Math.max(1, Math.floor(draftNumber(data.pax))),
    guests: Array.isArray(data.guests) ? data.guests : [],
    groupContact: {
      firstName: draftString(data.groupContact?.firstName),
      lastName: draftString(data.groupContact?.lastName),
      mobileNumber: draftString(data.groupContact?.mobileNumber),
      emailAddress: draftString(data.groupContact?.emailAddress),
    },
    useGuestOne: Boolean(data.useGuestOne),
    paymentMethodId: draftString(data.paymentMethodId || "gcash"),
    paymentProofUrl: draftString(data.paymentProofUrl),
    paymentReference: draftString(data.paymentReference),
    currentStep: data.currentStep === "payment" ? "payment" : "guests",
  };

  return (
    <GuestCheckoutClient
      pkg={pkg}
      departureId={draft.departureId}
      addonId={draft.addonId}
      pax={draft.pax}
      draft={draft}
      requestedStep={searchParams.step}
    />
  );
}
