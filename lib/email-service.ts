import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";
import { adminDb } from "@/lib/firebase-admin";
import { transactionalEmailTypes, type SendEmailPayload, type SendEmailResult } from "@/lib/email-types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let resendClient: Resend | undefined;

function resend() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("Missing RESEND_API_KEY.");
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

function emailFrom() {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("Missing EMAIL_FROM.");
  return from;
}

function safeError(error: unknown) {
  if (error instanceof Error && error.message) return error.message.slice(0, 500);
  return "Unable to send email.";
}

function validatePayload(payload: SendEmailPayload) {
  if (!emailPattern.test(payload.recipient)) return "A valid recipient email is required.";
  if (!payload.subject.trim()) return "Email subject is required.";
  if (!payload.html?.trim() && !payload.template?.id) return "Email HTML or template is required.";
  if (!transactionalEmailTypes.includes(payload.emailType)) return "Invalid email type.";
  return "";
}

async function logEmail(payload: SendEmailPayload, status: "SENT" | "FAILED", resendEmailId = "", errorMessage = "") {
  const ref = adminDb.collection("emailLogs").doc();
  await ref.set({
    id: ref.id,
    emailType: payload.emailType,
    recipient: payload.recipient,
    subject: payload.subject,
    resendEmailId,
    status,
    relatedEntityType: payload.relatedEntityType || "",
    relatedEntityId: payload.relatedEntityId || "",
    relatedReference: payload.relatedReference || "",
    errorMessage,
    metadata: payload.metadata || {},
    sentAt: status === "SENT" ? FieldValue.serverTimestamp() : null,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function sendEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
  const validationError = validatePayload(payload);
  if (validationError) {
    const logId = await logEmail(payload, "FAILED", "", validationError).catch(() => "");
    return { ok: false, error: validationError, logId: logId || undefined };
  }

  try {
    const response = await resend().emails.send({
      from: emailFrom(),
      to: payload.recipient,
      subject: payload.subject,
      ...(payload.template ? { template: payload.template } : { html: payload.html || "" }),
    });

    if (response.error) {
      const error = response.error.message || "Resend rejected the email.";
      const logId = await logEmail(payload, "FAILED", "", error);
      return { ok: false, error, logId };
    }

    const resendEmailId = response.data?.id || "";
    const logId = await logEmail(payload, "SENT", resendEmailId);
    return { ok: true, resendEmailId, logId };
  } catch (error) {
    const message = safeError(error);
    const logId = await logEmail(payload, "FAILED", "", message).catch(() => "");
    return { ok: false, error: message, logId: logId || undefined };
  }
}
