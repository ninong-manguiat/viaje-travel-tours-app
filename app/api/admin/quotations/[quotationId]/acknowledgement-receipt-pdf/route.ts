import { NextRequest, NextResponse } from "next/server";
import { quotationAcknowledgementReceiptPdfResponse } from "@/lib/pdf/viaje-pdf";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

export async function GET(request: NextRequest, { params }: { params: { quotationId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const response = await quotationAcknowledgementReceiptPdfResponse(params.quotationId);
  if (!response) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  if (response === "not_finalized") return NextResponse.json({ error: "Finalize the quotation before downloading an acknowledgement receipt." }, { status: 400 });

  return response;
}
