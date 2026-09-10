import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { documentUploadId, fileTypeAllowed, serializeDocumentBin, statusFromRequirements, type DocumentUpload } from "@/lib/document-bins";
import { uploadFile } from "@/lib/storage";

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

async function binByToken(token: string) {
  const { adminDb } = await import("@/lib/firebase-admin");
  const snapshot = await adminDb.collection("documentBins").where("publicToken", "==", token).limit(1).get();
  return { adminDb, doc: snapshot.docs[0] };
}

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const formData = await request.formData();
  const requirementId = String(formData.get("requirementId") || "");
  const files = formData.getAll("files").filter((file): file is File => file instanceof File);

  if (!requirementId || !files.length) {
    return NextResponse.json({ error: "Missing document upload details" }, { status: 400 });
  }

  const { doc } = await binByToken(params.token);
  if (!doc) {
    const { adminDb } = await import("@/lib/firebase-admin");
    const bookingSnapshot = await adminDb.collection("bookings").where("documentToken", "==", params.token).limit(1).get();
    const bookingDoc = bookingSnapshot.docs[0];
    if (!bookingDoc) return NextResponse.json({ error: "Invalid or expired document link" }, { status: 404 });

    const booking = bookingDoc.data() ?? {};
    const requirements = Array.isArray(booking.documentRequirements) ? booking.documentRequirements : [];
    const requirement = requirements.find((item) => item.id === requirementId);
    if (!requirement) return NextResponse.json({ error: "Document requirement not found" }, { status: 404 });

    const file = files[0];
    const bytes = Buffer.from(await file.arrayBuffer());
    const key = `booking-documents/${bookingDoc.id}/${requirementId}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const url = await uploadFile("travelDocuments", key, bytes, file.type || "application/octet-stream");
    const documentRequirements = requirements.map((item) => item.id === requirementId
      ? { ...item, status: "SUBMITTED", uploadedFileUrl: url, submittedAt: new Date().toISOString() }
      : item);

    await bookingDoc.ref.set({ documentRequirements }, { merge: true });

    return NextResponse.json({
      documentBin: {
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
        requirements: documentRequirements.map((item) => ({
          id: String(item.id || ""),
          documentBinId: bookingDoc.id,
          documentType: item.type,
          customName: "",
          uploadMode: "SINGLE",
          acceptedFileTypes: ["PDF", "JPG / JPEG", "PNG"],
          status: item.status,
          createdAt: String(item.requestedAt || ""),
          uploads: item.uploadedFileUrl ? [{
            id: `legacy-${item.id}`,
            fileUrl: String(item.uploadedFileUrl),
            storageKey: "",
            originalFilename: file.name,
            uploadedAt: String(item.submittedAt || ""),
            reviewStatus: "SUBMITTED",
          }] : [],
        })),
      },
    });
  }

  const bin = serializeDocumentBin(doc.id, doc.data() ?? {});
  if (bin.status === "CANCELLED") return NextResponse.json({ error: "This document bin has been cancelled." }, { status: 409 });

  const requirement = bin.requirements.find((item) => item.id === requirementId);
  if (!requirement) return NextResponse.json({ error: "Document requirement not found" }, { status: 404 });
  if (requirement.status === "APPROVED") return NextResponse.json({ error: "Approved documents cannot be replaced." }, { status: 409 });
  if (requirement.uploadMode === "SINGLE" && files.length > 1) return NextResponse.json({ error: "Only one file is allowed for this requirement." }, { status: 400 });

  const unsupported = files.find((file) => !fileTypeAllowed(file, requirement.acceptedFileTypes));
  if (unsupported) return NextResponse.json({ error: `${unsupported.name} is not an accepted file type.` }, { status: 400 });

  const uploadedAt = new Date().toISOString();
  const uploads: DocumentUpload[] = [];

  for (const file of files) {
    const key = `document-bins/${doc.id}/${requirementId}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const fileUrl = await uploadFile("travelDocuments", key, bytes, file.type || "application/octet-stream");
    uploads.push({
      id: documentUploadId(),
      fileUrl,
      storageKey: key,
      originalFilename: file.name,
      uploadedAt,
      reviewStatus: "SUBMITTED",
    });
  }

  const requirements = bin.requirements.map((item) => item.id === requirementId
    ? { ...item, status: "SUBMITTED" as const, uploads: item.uploadMode === "MULTIPLE" ? [...item.uploads, ...uploads] : uploads }
    : item);
  const status = statusFromRequirements(requirements, bin.status);

  await doc.ref.set({ requirements, status, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  return NextResponse.json({ documentBin: { ...bin, requirements, status, updatedAt: new Date().toISOString() } });
}
