import { notFound } from "next/navigation";
import { DocumentUploadClient } from "@/components/domain/document-upload-client";

export const dynamic = "force-dynamic";

export default async function DocumentUploadPage({ params }: { params: { token: string } }) {
  const { adminDb } = await import("@/lib/firebase-admin");
  const snapshot = await adminDb.collection("bookings").where("documentToken", "==", params.token).limit(1).get();
  const doc = snapshot.docs[0];

  if (!doc) notFound();

  const booking = doc.data() ?? {};
  const requirements = Array.isArray(booking.documentRequirements) ? booking.documentRequirements : [];

  return <DocumentUploadClient token={params.token} requirements={requirements} />;
}
