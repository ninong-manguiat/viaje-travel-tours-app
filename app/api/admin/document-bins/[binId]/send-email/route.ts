import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { documentName, emailPattern, serializeDocumentBin } from "@/lib/document-bins";
import { emailTemplateSubjects } from "@/lib/email-templates";
import { publicAppUrl } from "@/lib/public-url";
import { sendDocumentRequestEmail } from "@/lib/resend-template-registry";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

function safeSendError(message = "") {
  const normalized = message.toLowerCase();
  if (normalized.includes("api key")) return "Email service is not configured.";
  if (normalized.includes("domain") && normalized.includes("verif")) return "Email sender domain is not verified in Resend.";
  if (normalized.includes("from")) return "Email sender was rejected by Resend. Check EMAIL_FROM and sender domain verification.";
  return "Unable to send document request email.";
}

export async function POST(request: NextRequest, { params }: { params: { binId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const { adminDb } = await import("@/lib/firebase-admin");
  const ref = adminDb.collection("documentBins").doc(params.binId);
  const snapshot = await ref.get();
  if (!snapshot.exists) return NextResponse.json({ error: "Document bin not found." }, { status: 404 });

  const bin = serializeDocumentBin(snapshot.id, snapshot.data() ?? {});
  if (bin.status === "CANCELLED" || !bin.publicToken) {
    return NextResponse.json({ error: "Cancelled document bins cannot be sent to clients." }, { status: 400 });
  }
  if (!emailPattern.test(bin.email)) {
    return NextResponse.json({ error: "Document bin has no valid client email address." }, { status: 400 });
  }
  if (!bin.requirements.length) {
    return NextResponse.json({ error: "Document bin has no requested documents." }, { status: 400 });
  }

  const documentBinUrl = publicAppUrl(`/documents/${bin.publicToken}`);
  const result = await sendDocumentRequestEmail({
    clientName: bin.clientName,
    documentBinReference: bin.referenceNumber,
    purpose: bin.purpose,
    documentRequirements: bin.requirements.map(documentName),
    documentBinUrl,
  }, {
    recipient: bin.email,
    subject: `${emailTemplateSubjects.DOCUMENT_REQUEST} - ${bin.referenceNumber}`,
    relatedEntityType: "documentBin",
    relatedEntityId: bin.id,
    relatedReference: bin.referenceNumber,
    metadata: {
      documentBinUrl,
      requirementCount: bin.requirements.length,
      bookingId: bin.bookingId || "",
    },
  });

  await ref.set({
    documentRequestEmailAttemptedAt: FieldValue.serverTimestamp(),
    documentRequestEmailSentAt: result.ok ? FieldValue.serverTimestamp() : null,
    documentRequestEmailLogId: result.logId || "",
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true }).catch(() => null);

  if (!result.ok) return NextResponse.json({ error: safeSendError(result.error), logId: result.logId || "" }, { status: 500 });
  return NextResponse.json({ ok: true, resendEmailId: result.resendEmailId, logId: result.logId });
}
