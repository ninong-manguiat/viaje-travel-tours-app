import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import {
  acceptedFileTypeOptions,
  documentRequirementId,
  documentTypeOptions,
  serializeDocumentBin,
  statusFromRequirements,
  type AcceptedFileType,
  type DocumentBinStatus,
  type DocumentRequirement,
  type DocumentRequirementStatus,
  type DocumentType,
  type UploadMode,
} from "@/lib/document-bins";
import { deleteFile } from "@/lib/storage";

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
    id: documentRequirementId(),
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

export async function PATCH(request: NextRequest, { params }: { params: { binId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const action = String(body?.action || "");
  const { adminDb } = await import("@/lib/firebase-admin");
  const ref = adminDb.collection("documentBins").doc(params.binId);
  const snapshot = await ref.get();
  if (!snapshot.exists) return NextResponse.json({ error: "Document bin not found" }, { status: 404 });

  const bin = serializeDocumentBin(snapshot.id, snapshot.data() ?? {});

  if (action === "cancelBin") {
    try {
      await Promise.all(bin.requirements.flatMap((requirement) =>
        requirement.uploads
          .filter((upload) => upload.storageKey)
          .map((upload) => deleteFile("travelDocuments", upload.storageKey))
      ));
    } catch {
      return NextResponse.json({ error: "Unable to delete one or more uploaded files. Bin was not cancelled." }, { status: 500 });
    }

    const requirements = bin.requirements.map((requirement) => ({ ...requirement, status: "PENDING" as const, uploads: [] }));
    await ref.set({
      status: "CANCELLED",
      publicToken: "",
      requirements,
      cancelledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return NextResponse.json({ documentBin: { ...bin, publicToken: "", requirements, status: "CANCELLED", cancelledAt: new Date().toISOString() } });
  }

  if (action === "reviewRequirement") {
    const requirementId = String(body.requirementId || "");
    const status = String(body.status || "") as DocumentRequirementStatus;
    if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) return NextResponse.json({ error: "Invalid review status." }, { status: 400 });

    const requirements = bin.requirements.map((item) => item.id === requirementId ? {
      ...item,
      status,
      uploads: item.uploads.map((upload, index) => index === item.uploads.length - 1 ? { ...upload, reviewStatus: status } : upload),
    } : item);
    const nextStatus = statusFromRequirements(requirements, bin.status);

    await ref.set({ requirements, status: nextStatus, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ documentBin: { ...bin, requirements, status: nextStatus } });
  }

  if (action === "addRequirement") {
    const requirement = cleanRequirement(body.requirement as Partial<DocumentRequirement>, bin.id);
    if (requirement.documentType === "Other" && !requirement.customName) return NextResponse.json({ error: "Custom document name is required." }, { status: 400 });
    if (requirement.documentType !== "Other" && bin.requirements.some((item) => item.documentType === requirement.documentType)) {
      return NextResponse.json({ error: "Duplicate document requirements are not allowed." }, { status: 400 });
    }

    const requirements = [...bin.requirements, requirement];
    const nextStatus: DocumentBinStatus = bin.status === "CANCELLED" ? "CANCELLED" : "ACTIVE";
    await ref.set({ requirements, status: nextStatus, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ documentBin: { ...bin, requirements, status: nextStatus } });
  }

  return NextResponse.json({ error: "Unsupported document bin update." }, { status: 400 });
}
