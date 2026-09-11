export const documentTypeOptions = [
  "Passport",
  "1x1 Picture",
  "ID",
  "BIR Form 2316",
  "NBI Clearance",
  "Birth Certificate",
  "Marriage Certificate",
  "Other",
] as const;

export const acceptedFileTypeOptions = ["PDF", "JPG / JPEG", "PNG"] as const;

export type DocumentBinStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type DocumentRequirementStatus = "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED";
export type UploadMode = "SINGLE" | "MULTIPLE";
export type AcceptedFileType = typeof acceptedFileTypeOptions[number];
export type DocumentType = typeof documentTypeOptions[number];

export type DocumentUpload = {
  id: string;
  fileUrl: string;
  storageKey: string;
  originalFilename: string;
  uploadedAt: string;
  reviewStatus: DocumentRequirementStatus;
};

export type DocumentRequirement = {
  id: string;
  documentBinId: string;
  documentType: DocumentType;
  customName?: string;
  uploadMode: UploadMode;
  acceptedFileTypes: AcceptedFileType[];
  status: DocumentRequirementStatus;
  createdAt: string;
  uploads: DocumentUpload[];
};

export type DocumentBin = {
  id: string;
  referenceNumber: string;
  bookingId?: string;
  bookingReference?: string;
  clientName: string;
  email: string;
  contactNumber: string;
  purpose: string;
  publicToken: string;
  status: DocumentBinStatus;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  requirements: DocumentRequirement[];
};

function randomToken(bytes = 16) {
  const array = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(array);
  return Array.from(array, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function documentBinToken() {
  return randomToken(18);
}

export function documentRequirementId() {
  return `req-${Date.now()}-${randomToken(4)}`;
}

export function documentUploadId() {
  return `upload-${Date.now()}-${randomToken(4)}`;
}

export function documentName(requirement: Pick<DocumentRequirement, "documentType" | "customName">) {
  return requirement.documentType === "Other" ? requirement.customName || "Other Document" : requirement.documentType;
}

export function timestampValue(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value && typeof value === "object" && "seconds" in value && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000).toISOString();
  }

  return typeof value === "string" ? value : "";
}

export function serializeDocumentBin(id: string, data: FirebaseFirestore.DocumentData): DocumentBin {
  return {
    id,
    referenceNumber: String(data.referenceNumber || ""),
    bookingId: String(data.bookingId || ""),
    bookingReference: String(data.bookingReference || ""),
    clientName: String(data.clientName || ""),
    email: String(data.email || ""),
    contactNumber: String(data.contactNumber || ""),
    purpose: String(data.purpose || ""),
    publicToken: String(data.publicToken || ""),
    status: ["ACTIVE", "COMPLETED", "CANCELLED"].includes(String(data.status)) ? data.status : "ACTIVE",
    cancelledAt: timestampValue(data.cancelledAt),
    createdAt: timestampValue(data.createdAt),
    updatedAt: timestampValue(data.updatedAt),
    requirements: Array.isArray(data.requirements) ? data.requirements.map((item: Partial<DocumentRequirement>) => ({
      id: String(item.id || documentRequirementId()),
      documentBinId: String(item.documentBinId || id),
      documentType: documentTypeOptions.includes(item.documentType as DocumentType) ? item.documentType as DocumentType : "Other",
      customName: String(item.customName || ""),
      uploadMode: item.uploadMode === "MULTIPLE" ? "MULTIPLE" : "SINGLE",
      acceptedFileTypes: Array.isArray(item.acceptedFileTypes) && item.acceptedFileTypes.length
        ? item.acceptedFileTypes.filter((type): type is AcceptedFileType => acceptedFileTypeOptions.includes(type as AcceptedFileType))
        : ["PDF", "JPG / JPEG", "PNG"],
      status: ["PENDING", "SUBMITTED", "APPROVED", "REJECTED"].includes(String(item.status)) ? item.status as DocumentRequirementStatus : "PENDING",
      createdAt: String(item.createdAt || ""),
      uploads: Array.isArray(item.uploads) ? item.uploads.map((upload) => ({
        id: String(upload.id || documentUploadId()),
        fileUrl: String(upload.fileUrl || ""),
        storageKey: String(upload.storageKey || ""),
        originalFilename: String(upload.originalFilename || ""),
        uploadedAt: String(upload.uploadedAt || ""),
        reviewStatus: ["PENDING", "SUBMITTED", "APPROVED", "REJECTED"].includes(String(upload.reviewStatus)) ? upload.reviewStatus as DocumentRequirementStatus : "SUBMITTED",
      })) : [],
    })) : [],
  };
}

export function documentBinProgress(requirements: DocumentRequirement[]) {
  const total = requirements.length;
  const submitted = requirements.filter((item) => item.status !== "PENDING").length;
  const approved = requirements.filter((item) => item.status === "APPROVED").length;
  return { total, submitted, approved };
}

export function statusFromRequirements(requirements: DocumentRequirement[], currentStatus: DocumentBinStatus) {
  if (currentStatus === "CANCELLED") return "CANCELLED";
  return requirements.length > 0 && requirements.every((item) => item.status === "APPROVED") ? "COMPLETED" : "ACTIVE";
}

export function acceptAttribute(types: AcceptedFileType[]) {
  const accepts = new Set<string>();
  if (types.includes("PDF")) accepts.add(".pdf");
  if (types.includes("JPG / JPEG")) {
    accepts.add(".jpg");
    accepts.add(".jpeg");
  }
  if (types.includes("PNG")) accepts.add(".png");
  return Array.from(accepts).join(",");
}

export function fileTypeAllowed(file: File, acceptedTypes: AcceptedFileType[]) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return acceptedTypes.some((accepted) => {
    if (accepted === "PDF") return type === "application/pdf" || name.endsWith(".pdf");
    if (accepted === "JPG / JPEG") return ["image/jpeg", "image/jpg"].includes(type) || name.endsWith(".jpg") || name.endsWith(".jpeg");
    if (accepted === "PNG") return type === "image/png" || name.endsWith(".png");
    return false;
  });
}
