import { NextRequest, NextResponse } from "next/server";
import { quotationPdfResponse } from "@/lib/pdf/viaje-pdf";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

export async function GET(request: NextRequest, { params }: { params: { quotationId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const response = await quotationPdfResponse(params.quotationId);
  if (!response) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

  return response;
}
