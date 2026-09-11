import "server-only";

import { sendEmail } from "@/lib/email-service";
import {
  type BookingConfirmedEmailData,
  type BookingReceivedEmailData,
  type DocumentRequestEmailData,
  type PaymentRequestEmailData,
  type SendEmailResult,
  type SubsequentPaymentRequestEmailData,
  type TransactionalEmailType,
} from "@/lib/email-types";
import { emailTemplateSubjects } from "@/lib/email-templates";
import { formatDate, formatPeso } from "@/lib/utils";

type TemplateSendOptions = {
  recipient: string;
  relatedEntityType?: "booking" | "documentBin" | "payment" | "test";
  relatedEntityId?: string;
  relatedReference?: string;
  subject?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export const resendTemplateAliases = {
  BOOKING_RECEIVED: "booking-received",
  BOOKING_CONFIRMED: "booking-confirmed",
  DOCUMENT_REQUEST: "document-request",
  PAYMENT_REQUEST: "payment-request",
  SUBSEQUENT_PAYMENT_REQUEST: "subsequent-payment-request",
} satisfies Record<TransactionalEmailType, string>;

type TemplatePayloads = {
  BOOKING_RECEIVED: BookingReceivedEmailData;
  BOOKING_CONFIRMED: BookingConfirmedEmailData;
  DOCUMENT_REQUEST: DocumentRequestEmailData;
  PAYMENT_REQUEST: PaymentRequestEmailData;
  SUBSEQUENT_PAYMENT_REQUEST: SubsequentPaymentRequestEmailData;
};

const requiredFields = {
  BOOKING_RECEIVED: [
    "firstName",
    "packageName",
    "bookingReference",
    "departureDate",
    "guestCount",
    "totalAmount",
    "paymentAmount",
    "remainingBalance",
    "paymentMethod",
    "itineraryContent",
    "bookingUrl",
  ],
  BOOKING_CONFIRMED: [
    "firstName",
    "packageName",
    "bookingReference",
    "paymentName",
    "paymentAmount",
    "paymentMethod",
    "paymentDate",
    "totalAmount",
    "totalPaid",
    "remainingBalance",
    "bookingUrl",
  ],
  DOCUMENT_REQUEST: [
    "clientName",
    "documentBinReference",
    "purpose",
    "documentRequirements",
    "documentBinUrl",
  ],
  PAYMENT_REQUEST: [
    "firstName",
    "bookingReference",
    "packageName",
    "paymentName",
    "amountDue",
    "dueDate",
    "paymentUrl",
  ],
  SUBSEQUENT_PAYMENT_REQUEST: [
    "firstName",
    "bookingReference",
    "paymentName",
    "paymentAmount",
    "paymentMethod",
    "paymentDate",
    "totalAmount",
    "totalPaid",
    "remainingBalance",
    "bookingUrl",
    "isFullyPaid",
  ],
} satisfies Record<TransactionalEmailType, string[]>;

export function formatCurrencyForEmail(value: number) {
  return formatPeso(value);
}

export function formatDateForEmail(value: string | Date) {
  return formatDate(value);
}

export function formatDocumentRequirementsForEmail(requirements: string[]) {
  return requirements.map((item) => item.trim()).filter(Boolean).join("\n");
}

export function formatItineraryForEmail(days: Array<{ day?: string; name?: string; activities?: Array<{ activity?: string }> }>) {
  return days
    .map((item) => {
      const title = [item.day, item.name].filter(Boolean).join(": ");
      const activities = (item.activities ?? []).map((activity) => activity.activity).filter(Boolean).join(", ");
      return [title, activities].filter(Boolean).join(" - ");
    })
    .filter(Boolean)
    .join("\n");
}

function stringifyVariables(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (Array.isArray(value)) return [key, formatDocumentRequirementsForEmail(value.map(String))];
      if (typeof value === "boolean") return [key, value ? "true" : "false"];
      return [key, typeof value === "number" ? value : String(value ?? "")];
    })
  ) as Record<string, string | number>;
}

function validateTemplatePayload<T extends TransactionalEmailType>(emailType: T, data: TemplatePayloads[T]) {
  const variables = data as Record<string, unknown>;
  for (const field of requiredFields[emailType]) {
    const value = variables[field];
    if (Array.isArray(value) && value.length === 0) return `${field} is required.`;
    if (typeof value === "boolean") continue;
    if (value === null || value === undefined || String(value).trim() === "") return `${field} is required.`;
  }
  return "";
}

async function sendTemplateEmail<T extends TransactionalEmailType>(
  emailType: T,
  data: TemplatePayloads[T],
  options: TemplateSendOptions
): Promise<SendEmailResult> {
  const validationError = validateTemplatePayload(emailType, data);
  if (validationError) return { ok: false, error: validationError };

  return sendEmail({
    recipient: options.recipient,
    emailType,
    subject: options.subject || emailTemplateSubjects[emailType],
    template: {
      id: resendTemplateAliases[emailType],
      variables: stringifyVariables(data as Record<string, unknown>),
    },
    relatedEntityType: options.relatedEntityType,
    relatedEntityId: options.relatedEntityId,
    relatedReference: options.relatedReference,
    metadata: options.metadata,
  });
}

export function sendBookingReceivedEmail(data: BookingReceivedEmailData, options: TemplateSendOptions) {
  return sendTemplateEmail("BOOKING_RECEIVED", data, options);
}

export function sendBookingConfirmedEmail(data: BookingConfirmedEmailData, options: TemplateSendOptions) {
  return sendTemplateEmail("BOOKING_CONFIRMED", data, options);
}

export function sendDocumentRequestEmail(data: DocumentRequestEmailData, options: TemplateSendOptions) {
  return sendTemplateEmail("DOCUMENT_REQUEST", data, options);
}

export function sendPaymentRequestEmail(data: PaymentRequestEmailData, options: TemplateSendOptions) {
  return sendTemplateEmail("PAYMENT_REQUEST", data, options);
}

export function sendSubsequentPaymentEmail(data: SubsequentPaymentRequestEmailData, options: TemplateSendOptions) {
  return sendTemplateEmail("SUBSEQUENT_PAYMENT_REQUEST", data, options);
}
