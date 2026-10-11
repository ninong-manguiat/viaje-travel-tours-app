import "server-only";

import type { NextRequest } from "next/server";
import { emailTemplateSubjects } from "@/lib/email-templates";
import { publicAppUrl } from "@/lib/public-url";
import { sendSubsequentPaymentEmail } from "@/lib/resend-template-registry";
import { formatDate, formatPeso } from "@/lib/utils";

type PaymentSubmissionEmailInput = {
  request: NextRequest;
  recipient: string;
  firstName: string;
  reference: string;
  publicPath: string;
  relatedEntityId: string;
  payment: {
    id: string;
    paymentName?: string;
    label?: string;
    method?: string;
    amountExpected?: number;
    amountSubmitted?: number;
    paymentDate?: string;
  };
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendPaymentSubmissionEmail({
  request,
  recipient,
  firstName,
  reference,
  publicPath,
  relatedEntityId,
  payment,
  totalAmount,
  totalPaid,
  remainingBalance,
  metadata,
}: PaymentSubmissionEmailInput) {
  const cleanRecipient = recipient.trim();
  if (!emailPattern.test(cleanRecipient)) return { attempted: false, sent: false, reason: "missing_recipient" };

  const publicUrl = publicAppUrl(publicPath, request);
  const paymentAmount = Number(payment.amountSubmitted || payment.amountExpected || 0);
  const result = await sendSubsequentPaymentEmail({
    firstName: firstName || "there",
    bookingReference: reference,
    paymentName: payment.paymentName || payment.label || "Payment submitted for verification",
    paymentAmount: formatPeso(paymentAmount),
    paymentMethod: payment.method || "To be verified",
    paymentDate: payment.paymentDate ? formatDate(payment.paymentDate) : formatDate(new Date().toISOString()),
    totalAmount: formatPeso(totalAmount),
    totalPaid: formatPeso(totalPaid),
    remainingBalance: formatPeso(remainingBalance),
    bookingUrl: publicUrl,
    isFullyPaid: false,
  }, {
    recipient: cleanRecipient,
    subject: `${emailTemplateSubjects.SUBSEQUENT_PAYMENT_REQUEST} - ${reference}`,
    relatedEntityType: "payment",
    relatedEntityId,
    relatedReference: reference,
    metadata: {
      paymentId: payment.id,
      publicUrl,
      paymentStatus: "for_verification",
      ...metadata,
    },
  }).catch((error) => ({
    ok: false as const,
    error: error instanceof Error ? error.message : "Unable to send payment submission email.",
    logId: undefined,
  }));

  return result.ok
    ? { attempted: true, sent: true, logId: result.logId, resendEmailId: result.resendEmailId }
    : { attempted: true, sent: false, reason: result.error, logId: result.logId };
}
