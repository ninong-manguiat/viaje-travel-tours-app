import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { listPaymentMethods, newPaymentMethod, normalizePaymentMethod } from "@/lib/payment-methods";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

function validatePaymentMethod(method: ReturnType<typeof normalizePaymentMethod>) {
  if (!method.bank) return "Bank is required.";
  if (!method.referenceNumber) return "Reference number is required.";
  if (!method.qrImageUrl) return "QR image is required.";
  return "";
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();

  const paymentMethods = await listPaymentMethods();
  return NextResponse.json({ paymentMethods });
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const paymentMethod = normalizePaymentMethod({ ...newPaymentMethod(), ...body?.paymentMethod });
  const error = validatePaymentMethod(paymentMethod);

  if (error) return NextResponse.json({ error }, { status: 400 });

  const { adminDb } = await import("@/lib/firebase-admin");
  await adminDb.collection("paymentMethods").doc(paymentMethod.id).set({
    ...paymentMethod,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ paymentMethod });
}
