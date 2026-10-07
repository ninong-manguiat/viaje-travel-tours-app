import { notFound } from "next/navigation";
import { FileDown } from "lucide-react";
import { StatusBadge } from "@/components/domain/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQuotationByToken, quotationItemDetail } from "@/lib/quotations";
import { formatDate, formatPeso } from "@/lib/utils";

export const dynamic = "force-dynamic";

function multilineText(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

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
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <a
              href={`/api/quotations/${encodeURIComponent(params.token)}/pdf`}
              className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full border-[1.5px] border-transparent bg-viaje-red px-6 py-3 text-sm font-semibold text-white transition duration-150 hover:-translate-y-0.5 hover:bg-viaje-red2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <FileDown className="h-4 w-4" />
              Download Quotation
            </a>
            <StatusBadge status={quotation.status} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Quotation Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="hidden border-b border-viaje-line pb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-viaje-soft sm:grid sm:grid-cols-[minmax(0,1.25fr)_minmax(0,2.75fr)_minmax(110px,1fr)] sm:gap-4">
                <span>Service</span>
                <span>Additional Detail / Remarks</span>
                <span className="text-right">Amount</span>
              </div>
              <div className="divide-y divide-viaje-line">
                {quotation.items.map((item) => (
                  <div key={item.id} className="grid gap-3 py-5 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,2.75fr)_minmax(110px,1fr)] sm:gap-4 sm:items-start">
                    <div className="min-w-0">
                      <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-viaje-soft sm:hidden">Service</p>
                      <h2 className="font-semibold text-viaje-navy">{item.itemName}</h2>
                    </div>
                    <div className="min-w-0 space-y-1 text-sm leading-6 text-viaje-soft">
                      <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-viaje-soft sm:hidden">Additional Detail / Remarks</p>
                      {quotationItemDetail(item) && (
                        <p className="whitespace-normal break-words">
                          <span className="font-semibold text-viaje-ink">{quotationItemDetail(item)?.label}:</span> {quotationItemDetail(item)?.value}
                        </p>
                      )}
                      <p className="whitespace-normal break-words"><span className="font-semibold text-viaje-ink">Remarks:</span> {item.remarks}</p>
                    </div>
                    <div className="min-w-0 sm:text-right">
                      <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-viaje-soft sm:hidden">Amount</p>
                      <p className="font-bold text-viaje-navy">{formatPeso(item.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between rounded-[10px] bg-viaje-paperAlt p-4 text-lg font-bold text-viaje-navy">
                <span>Grand Total</span>
                <span>{formatPeso(quotation.totalAmount)}</span>
              </div>
              {(quotation.inclusions || quotation.exclusions) && (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {quotation.inclusions && (
                    <div className="rounded-[10px] border border-viaje-line bg-white p-4">
                      <h2 className="font-semibold text-viaje-navy">Inclusions</h2>
                      <div className="mt-2 space-y-1 text-sm leading-6 text-viaje-soft">
                        {multilineText(quotation.inclusions).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}
                      </div>
                    </div>
                  )}
                  {quotation.exclusions && (
                    <div className="rounded-[10px] border border-viaje-line bg-white p-4">
                      <h2 className="font-semibold text-viaje-navy">Exclusions</h2>
                      <div className="mt-2 space-y-1 text-sm leading-6 text-viaje-soft">
                        {multilineText(quotation.exclusions).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
