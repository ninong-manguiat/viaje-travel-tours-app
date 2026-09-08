import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { normalizePaymentMethod } from "@/lib/payment-methods";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

async function docRef(paymentMethodId: string) {
  const { adminDb } = await import("@/lib/firebase-admin");
  return adminDb.collection("paymentMethods").doc(paymentMethodId);
}

function validatePaymentMethod(method: ReturnType<typeof normalizePaymentMethod>) {
  if (!method.bank) return "Bank is required.";
  if (!method.referenceNumber) return "Reference number is required.";
  if (!method.qrImageUrl) return "QR image is required.";
  return "";
}

export async function GET(request: NextRequest, { params }: { params: { paymentMethodId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const snapshot = await (await docRef(params.paymentMethodId)).get();
  if (!snapshot.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ paymentMethod: normalizePaymentMethod({ id: snapshot.id, ...snapshot.data() }) });
}

export async function PUT(request: NextRequest, { params }: { params: { paymentMethodId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const paymentMethod = normalizePaymentMethod({ ...body?.paymentMethod, id: params.paymentMethodId });
  const error = validatePaymentMethod(paymentMethod);

  if (error) return NextResponse.json({ error }, { status: 400 });

  await (await docRef(params.paymentMethodId)).set({ ...paymentMethod, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return NextResponse.json({ paymentMethod });
}

export async function DELETE(request: NextRequest, { params }: { params: { paymentMethodId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  await (await docRef(params.paymentMethodId)).delete();
  return NextResponse.json({ ok: true });
}
