import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/domain/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQuotationByToken } from "@/lib/quotations";
import { formatDate, formatPeso } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PublicQuotationPage({ params }: { params: { token: string } }) {
  const quotation = await getQuotationByToken("publicToken", params.token);
  if (!quotation) notFound();

  return (
    <main className="bg-viaje-paper">
      <section className="container-page max-w-5xl py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-viaje-red">Viaje Travel and Tours</p>
            <h1 className="mt-3 font-serif text-4xl font-bold text-viaje-navy">Quotation</h1>
            <p className="mt-2 text-viaje-soft">This quotation is prepared for review and is not a confirmed booking.</p>
          </div>
          <StatusBadge status={quotation.status} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Quotation Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-viaje-line">
                {quotation.items.map((item) => (
                  <div key={item.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_150px] sm:items-start">
                    <div>
                      <h2 className="font-semibold text-viaje-navy">{item.itemName}</h2>
                      <p className="mt-1 text-sm leading-6 text-viaje-soft">{item.remarks}</p>
                    </div>
                    <p className="text-right font-bold text-viaje-navy">{formatPeso(item.amount)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between rounded-[10px] bg-viaje-paperAlt p-4 text-lg font-bold text-viaje-navy">
                <span>Grand Total</span>
                <span>{formatPeso(quotation.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Prepared For</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><p className="text-viaje-soft">Client Name</p><p className="font-semibold text-viaje-navy">{quotation.clientName}</p></div>
                <div><p className="text-viaje-soft">Email</p><p className="font-semibold text-viaje-navy">{quotation.email}</p></div>
                <div><p className="text-viaje-soft">Contact Number</p><p className="font-semibold text-viaje-navy">{quotation.contactNumber}</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Reference</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><p className="text-viaje-soft">Quotation Reference</p><p className="font-semibold text-viaje-navy">{quotation.referenceNumber}</p></div>
                <div><p className="text-viaje-soft">Created</p><p className="font-semibold text-viaje-navy">{quotation.createdAt ? formatDate(quotation.createdAt) : "-"}</p></div>
                <div><p className="text-viaje-soft">Payment Status</p><StatusBadge status={quotation.paymentStatus} /></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
