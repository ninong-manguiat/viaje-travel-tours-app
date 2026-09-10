import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import {
  acceptedFileTypeOptions,
  documentBinToken,
  documentRequirementId,
  documentTypeOptions,
  serializeDocumentBin,
  statusFromRequirements,
  type AcceptedFileType,
  type DocumentRequirement,
  type DocumentType,
  type UploadMode,
} from "@/lib/document-bins";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

function cleanRequirement(input: Partial<DocumentRequirement>, documentBinId: string): DocumentRequirement {
  const documentType = documentTypeOptions.includes(input.documentType as DocumentType) ? input.documentType as DocumentType : "Other";
  const acceptedFileTypes = Array.isArray(input.acceptedFileTypes)
    ? input.acceptedFileTypes.filter((type): type is AcceptedFileType => acceptedFileTypeOptions.includes(type as AcceptedFileType))
    : [];

  return {
    id: input.id || documentRequirementId(),
    documentBinId,
    documentType,
    customName: documentType === "Other" ? String(input.customName || "").trim() : "",
    uploadMode: input.uploadMode === "MULTIPLE" ? "MULTIPLE" : "SINGLE" as UploadMode,
    acceptedFileTypes: acceptedFileTypes.length ? acceptedFileTypes : ["PDF", "JPG / JPEG", "PNG"],
    status: "PENDING",
    createdAt: new Date().toISOString(),
    uploads: [],
  };
}

function validateBin(body: Record<string, unknown>) {
  const clientName = String(body.clientName || "").trim();
  const email = String(body.email || "").trim();
  const contactNumber = String(body.contactNumber || "").trim();
  const purpose = String(body.purpose || "").trim();
  const requirements = Array.isArray(body.requirements) ? body.requirements : [];

  if (!clientName || !email || !contactNumber || !purpose) return "Client name, email, contact number, and purpose are required.";
  if (!requirements.length) return "At least one document requirement is required.";

  const seen = new Set<string>();
  for (const requirement of requirements) {
    const item = requirement as Partial<DocumentRequirement>;
    const type = item.documentType;
    if (!documentTypeOptions.includes(type as DocumentType)) return "Invalid document type.";
    if (type === "Other" && !String(item.customName || "").trim()) return "Custom document name is required.";
    if (type !== "Other") {
      if (seen.has(String(type))) return "Duplicate document requirements are not allowed.";
      seen.add(String(type));
    }
    if (!Array.isArray(item.acceptedFileTypes) || !item.acceptedFileTypes.length) return "Accepted file types are required.";
  }

  return "";
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();

  const { adminDb } = await import("@/lib/firebase-admin");
  const snapshot = await adminDb.collection("documentBins").orderBy("createdAt", "desc").get();
  const documentBins = snapshot.docs.map((doc) => serializeDocumentBin(doc.id, doc.data()));

  return NextResponse.json({ documentBins });
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const error = validateBin(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const { adminDb } = await import("@/lib/firebase-admin");
  const countSnapshot = await adminDb.collection("documentBins").count().get();
  const nextNumber = 1001 + countSnapshot.data().count;
  const docRef = adminDb.collection("documentBins").doc();
  const requirements = (body.requirements as Partial<DocumentRequirement>[]).map((item) => cleanRequirement(item, docRef.id));
  const documentBin = {
    id: docRef.id,
    referenceNumber: `VDOC-${nextNumber}`,
    clientName: String(body.clientName || "").trim(),
    email: String(body.email || "").trim(),
    contactNumber: String(body.contactNumber || "").trim(),
    purpose: String(body.purpose || "").trim(),
    publicToken: documentBinToken(),
    status: statusFromRequirements(requirements, "ACTIVE"),
    requirements,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await docRef.set(documentBin);

  return NextResponse.json({
    documentBin: serializeDocumentBin(docRef.id, { ...documentBin, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
  });
}
