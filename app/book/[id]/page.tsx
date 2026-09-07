import { notFound } from "next/navigation";
import { GuestCheckoutClient } from "@/components/domain/guest-checkout-client";
import { getPackageById } from "@/lib/package-data";

export const dynamic = "force-dynamic";

export default async function BookingWizardPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { departureId?: string; addonId?: string; pax?: string };
}) {
  const pkg = await getPackageById(params.id);
  if (!pkg) notFound();

  return (
    <GuestCheckoutClient
      pkg={pkg}
      departureId={searchParams.departureId ?? ""}
      addonId={searchParams.addonId ?? "none"}
      pax={Number(searchParams.pax) || 1}
    />
  );
}
