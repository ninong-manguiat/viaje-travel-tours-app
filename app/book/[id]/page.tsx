import { notFound } from "next/navigation";
import { GuestCheckoutClient } from "@/components/domain/guest-checkout-client";
import { getPublishedPackageById } from "@/lib/package-data";
import { listPaymentMethods } from "@/lib/payment-methods";

export const dynamic = "force-dynamic";

export default async function BookingWizardPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { departureId?: string; addonId?: string; pax?: string };
}) {
  const pkg = await getPublishedPackageById(params.id);
  if (!pkg) notFound();
  const requestedDeparture = searchParams.departureId
    ? pkg.travelDates.find((date) => date.id === searchParams.departureId)
    : null;
  if (requestedDeparture?.availabilityStatus === "sold_out") notFound();
  const paymentMethods = await listPaymentMethods();

  return (
    <GuestCheckoutClient
      pkg={pkg}
      departureId={searchParams.departureId ?? ""}
      addonId={searchParams.addonId ?? "none"}
      pax={Number(searchParams.pax) || 1}
      paymentMethods={paymentMethods}
    />
  );
}
