import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { quotations } from "@/lib/sample-data";
import { formatPeso } from "@/lib/utils";

export default function QuotationViewPage({ params }: { params: { quotationId: string } }) {
  const quote = quotations.find((item) => item.id === params.quotationId) ?? quotations[0];
  return (
    <main className="container-page max-w-4xl py-10">
      <Card>
        <CardContent className="space-y-6 p-8">
          <div className="flex justify-between">
            <div><p className="text-sm text-muted-foreground">Viaje Travel and Tours</p><h1 className="text-3xl font-bold text-viaje-navy">Quotation {quote.quotationNumber}</h1></div>
            <Button>Download PDF</Button>
          </div>
          <table className="w-full text-sm">
            <tbody>{quote.lineItems.map((item) => <tr key={item.label} className="border-b"><td className="py-3">{item.label}</td><td>{item.qty}</td><td>{formatPeso(item.unitPrice)}</td><td className="text-right">{formatPeso(item.amount)}</td></tr>)}</tbody>
          </table>
          <div className="ml-auto max-w-xs space-y-2">
            <p className="flex justify-between"><span>Subtotal</span><strong>{formatPeso(quote.subtotal)}</strong></p>
            <p className="flex justify-between"><span>Discount</span><strong>{formatPeso(quote.discount)}</strong></p>
            <p className="flex justify-between text-lg"><span>Total</span><strong>{formatPeso(quote.total)}</strong></p>
          </div>
          <p className="text-sm text-muted-foreground">{quote.paymentTerms}</p>
          <Button>Proceed to Booking</Button>
        </CardContent>
      </Card>
    </main>
  );
}
