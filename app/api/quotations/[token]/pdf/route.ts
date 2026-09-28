import { NextResponse } from "next/server";
import { quotationPdfResponse } from "@/lib/pdf/viaje-pdf";
import { getQuotationByToken } from "@/lib/quotations";

export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const quotation = await getQuotationByToken("publicToken", params.token);
  if (!quotation) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

  const response = await quotationPdfResponse(quotation.id);
  if (!response) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

  return response;
}
