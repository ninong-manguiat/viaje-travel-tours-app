import { notFound } from "next/navigation";
import { PackageDetailClient } from "@/components/domain/package-detail-client";
import { listAirlines } from "@/lib/airline-data";
import { resolvePackageAirline } from "@/lib/airlines";
import { getPublishedPackageById } from "@/lib/package-data";

export const dynamic = "force-dynamic";

export default async function PackageDetailsPage({ params }: { params: { packageId: string } }) {
  const pkg = await getPublishedPackageById(params.packageId);
  if (!pkg) notFound();
  const airlines = await listAirlines();
  const airline = resolvePackageAirline(pkg, airlines);

  return <PackageDetailClient pkg={pkg} airline={airline} />;
}
