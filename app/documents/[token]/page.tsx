import { notFound } from "next/navigation";
import { DocumentUploadClient } from "@/components/domain/document-upload-client";
import { documentTypeOptions, serializeDocumentBin, type DocumentBin, type DocumentType } from "@/lib/document-bins";

export const dynamic = "force-dynamic";

export default async function DocumentUploadPage({ params }: { params: { token: string } }) {
  const { adminDb } = await import("@/lib/firebase-admin");
  const snapshot = await adminDb.collection("documentBins").where("publicToken", "==", params.token).limit(1).get();
  const doc = snapshot.docs[0];

  if (doc) {
    const documentBin = serializeDocumentBin(doc.id, doc.data() ?? {});
    if (documentBin.status === "CANCELLED") notFound();
    return <DocumentUploadClient documentBin={documentBin} />;
  }

  const bookingSnapshot = await adminDb.collection("bookings").where("documentToken", "==", params.token).limit(1).get();
  const bookingDoc = bookingSnapshot.docs[0];
  if (!bookingDoc) notFound();

  const booking = bookingDoc.data() ?? {};
  const requirements = Array.isArray(booking.documentRequirements) ? booking.documentRequirements : [];
  const documentBin: DocumentBin = {
    id: bookingDoc.id,
    referenceNumber: String(booking.reference || bookingDoc.id),
    clientName: "",
    email: "",
    contactNumber: "",
    purpose: "Travel Document Requirements",
    publicToken: params.token,
    status: "ACTIVE",
    createdAt: "",
    updatedAt: "",
    requirements: requirements.map((item) => {
      const documentType = documentTypeOptions.includes(item.type as DocumentType) ? item.type as DocumentType : "Other";
      return {
        id: String(item.id || ""),
        documentBinId: bookingDoc.id,
        documentType,
        customName: documentType === "Other" ? String(item.type || "Document") : "",
        uploadMode: "SINGLE",
        acceptedFileTypes: ["PDF", "JPG / JPEG", "PNG"],
        status: item.status === "SUBMITTED" ? "SUBMITTED" : "PENDING",
        createdAt: String(item.requestedAt || ""),
        uploads: item.uploadedFileUrl ? [{
          id: `legacy-${item.id}`,
          fileUrl: String(item.uploadedFileUrl),
          storageKey: "",
          originalFilename: "Uploaded file",
          uploadedAt: String(item.submittedAt || ""),
          reviewStatus: "SUBMITTED",
        }] : [],
      };
    }),
  };

  return <DocumentUploadClient documentBin={documentBin} />;
}
