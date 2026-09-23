import { NextRequest, NextResponse } from "next/server";
import { acknowledgementReceiptPdfResponse } from "@/lib/pdf/viaje-pdf";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(request: NextRequest) {
  return request.cookies.get("viaje-role")?.value === "admin";
}

export async function GET(request: NextRequest, { params }: { params: { bookingId: string } }) {
  if (!isAdmin(request)) return unauthorized();

  const response = await acknowledgementReceiptPdfResponse(params.bookingId);
  if (!response) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  return response;
}
