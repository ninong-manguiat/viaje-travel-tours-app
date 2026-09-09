import { notFound } from "next/navigation";
import { PackageDetailClient } from "@/components/domain/package-detail-client";
import { getPublishedPackageById } from "@/lib/package-data";

export const dynamic = "force-dynamic";

export default async function PackageDetailsPage({ params }: { params: { packageId: string } }) {
  const pkg = await getPublishedPackageById(params.packageId);
  if (!pkg) notFound();

  return <PackageDetailClient pkg={pkg} />;
}
