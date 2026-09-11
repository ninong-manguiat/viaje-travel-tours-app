export const transactionalEmailTypes = [
  "BOOKING_RECEIVED",
  "BOOKING_CONFIRMED",
  "DOCUMENT_REQUEST",
  "PAYMENT_REQUEST",
  "SUBSEQUENT_PAYMENT_REQUEST",
] as const;

export type TransactionalEmailType = typeof transactionalEmailTypes[number];

export type EmailRelatedEntityType = "booking" | "documentBin" | "payment" | "test";

export type SendEmailPayload = {
  recipient: string;
  subject: string;
  html?: string;
  template?: {
    id: string;
    variables: Record<string, string | number>;
  };
  emailType: TransactionalEmailType;
  relatedEntityType?: EmailRelatedEntityType;
  relatedEntityId?: string;
  relatedReference?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export type SendEmailResult =
  | { ok: true; resendEmailId: string; logId: string }
  | { ok: false; error: string; logId?: string };

export type BookingReceivedEmailData = {
  firstName: string;
  bookingReference: string;
  packageName: string;
  departureDate: string;
  guestCount: number;
  totalAmount: string;
  paymentAmount: string;
  remainingBalance: string;
  paymentMethod: string;
  itineraryContent: string;
  bookingUrl: string;
};

export type BookingConfirmedEmailData = {
  firstName: string;
  bookingReference: string;
  packageName: string;
  paymentName: string;
  paymentAmount: string;
  paymentMethod: string;
  paymentDate: string;
  totalAmount: string;
  totalPaid: string;
  remainingBalance: string;
  bookingUrl: string;
};

export type DocumentRequestEmailData = {
  clientName: string;
  documentBinReference: string;
  purpose: string;
  documentRequirements: string[];
  documentBinUrl: string;
};

export type PaymentRequestEmailData = {
  firstName: string;
  bookingReference: string;
  packageName: string;
  paymentName: string;
  amountDue: string;
  dueDate: string;
  paymentUrl: string;
};

export type SubsequentPaymentRequestEmailData = {
  firstName: string;
  bookingReference: string;
  paymentName: string;
  paymentAmount: string;
  paymentMethod: string;
  paymentDate: string;
  totalAmount: string;
  totalPaid: string;
  remainingBalance: string;
  bookingUrl: string;
  nextPaymentName?: string;
  nextPaymentAmount?: string;
  nextPaymentDueDate?: string;
  isFullyPaid: boolean;
};
