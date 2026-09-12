import { notFound } from "next/navigation";
import { QuotationPaymentClient } from "@/components/domain/quotation-payment-client";
import { getQuotationByToken } from "@/lib/quotations";
import { listPaymentMethods } from "@/lib/payment-methods";

export const dynamic = "force-dynamic";

export default async function QuotationPaymentPage({ params }: { params: { token: string } }) {
  const quotation = await getQuotationByToken("paymentToken", params.token);
  if (!quotation || quotation.status !== "FINALIZED") notFound();
  if (quotation.paymentStatus === "PENDING FOR VERIFICATION" || quotation.paymentStatus === "VERIFIED") notFound();

  const paymentMethods = await listPaymentMethods();
  return <QuotationPaymentClient quotation={quotation} paymentMethods={paymentMethods} token={params.token} />;
}
