import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage";

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

async function bookingByToken(token: string) {
  const { adminDb } = await import("@/lib/firebase-admin");
  const snapshot = await adminDb.collection("bookings").where("documentToken", "==", token).limit(1).get();
  return { adminDb, doc: snapshot.docs[0] };
}

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const formData = await request.formData();
  const requirementId = String(formData.get("requirementId") || "");
  const file = formData.get("file");

  if (!requirementId || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing document upload details" }, { status: 400 });
  }

  const { doc } = await bookingByToken(params.token);
  if (!doc) return NextResponse.json({ error: "Document request not found" }, { status: 404 });

  const booking = doc.data() ?? {};
  const requirements = Array.isArray(booking.documentRequirements) ? booking.documentRequirements : [];
  const requirement = requirements.find((item) => item.id === requirementId);

  if (!requirement) return NextResponse.json({ error: "Document requirement not found" }, { status: 404 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const key = `booking-documents/${doc.id}/${requirementId}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const url = await uploadFile("travelDocuments", key, bytes, file.type || "application/octet-stream");
  const documentRequirements = requirements.map((item) => item.id === requirementId
    ? { ...item, status: "SUBMITTED", uploadedFileUrl: url, submittedAt: new Date().toISOString() }
    : item);

  await doc.ref.set({ documentRequirements }, { merge: true });

  return NextResponse.json({ documentRequirements, uploadedFileUrl: url });
}
