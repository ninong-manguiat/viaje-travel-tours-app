import { notFound } from "next/navigation";
import { PackageDetailClient } from "@/components/domain/package-detail-client";
import { getPackageById } from "@/lib/package-data";

export const dynamic = "force-dynamic";

export default async function PackageDetailsPage({ params }: { params: { packageId: string } }) {
  const pkg = await getPackageById(params.packageId);
  if (!pkg) notFound();

  return <PackageDetailClient pkg={pkg} />;
}
