export const bookingDocumentTypes = [
  "Passport",
  "1x1 Picture",
  "ID",
  "BIR Form 2316",
  "NBI Clearance",
  "Birth Certificate",
  "Marriage Certificate",
] as const;

export type BookingDocumentType = typeof bookingDocumentTypes[number];

export type BookingDocumentRequirement = {
  id: string;
  type: BookingDocumentType;
  status: "PENDING" | "SUBMITTED";
  uploadedFileUrl?: string;
  requestedAt: string;
  submittedAt?: string;
};

export function isBookingDocumentType(value: string): value is BookingDocumentType {
  return bookingDocumentTypes.includes(value as BookingDocumentType);
}
