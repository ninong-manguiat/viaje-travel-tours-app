import { NextRequest, NextResponse } from "next/server";
import { paymentAcknowledgementReceiptPdfResponse } from "@/lib/pdf/viaje-pdf";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

export async function GET(request: NextRequest, { params }: { params: { paymentId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const response = await paymentAcknowledgementReceiptPdfResponse(params.paymentId);
  if (!response) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (response === "not_verified") return NextResponse.json({ error: "Only verified payments can download an acknowledgement receipt." }, { status: 400 });

  return response;
}
