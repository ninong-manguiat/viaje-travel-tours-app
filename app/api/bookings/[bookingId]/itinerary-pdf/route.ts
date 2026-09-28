import { NextResponse } from "next/server";
import { itineraryPdfResponse } from "@/lib/pdf/viaje-pdf";
import { getPublicBooking } from "@/lib/public-bookings";

export async function GET(_request: Request, { params }: { params: { bookingId: string } }) {
  const current = await getPublicBooking(params.bookingId);
  if (!current) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const response = await itineraryPdfResponse(current.booking.id);
  if (!response) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  return response;
}
