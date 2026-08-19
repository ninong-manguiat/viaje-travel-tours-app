import Link from "next/link";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { bookings, getPackage, payments } from "@/lib/sample-data";
import { formatPeso } from "@/lib/utils";

export default function BookingDetailsPage({ params }: { params: { bookingId: string } }) {
  const booking = bookings.find((item) => item.id === params.bookingId) ?? bookings[0];
  const pkg = getPackage(booking.packageId);
  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="font-semibold text-viaje-red">{booking.reference}</p>
        <h1 className="text-3xl font-bold text-viaje-navy">{pkg.title}</h1>
      </div>
      <div className="mb-8 grid gap-2 md:grid-cols-6">
        {["Quotation", "Reserved", "Payment", "Documents", "Confirmed", "Travel"].map((step) => <div key={step} className="rounded-md bg-viaje-mist px-3 py-2 text-center text-sm font-semibold">{step}</div>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead><TR><TH>Reference</TH><TH>Amount</TH><TH>Status</TH></TR></THead>
              <TBody>{payments.map((payment) => <TR key={payment.id}><TD>{payment.referenceNumber}</TD><TD>{formatPeso(payment.amountSubmitted)}</TD><TD><StatusBadge status={payment.status} /></TD></TR>)}</TBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Balance</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold">{formatPeso(booking.balance)}</p>
            <StatusBadge status={booking.status} />
            <Link href={`/book/${booking.id}/payment`}><Button className="w-full">Make a Payment</Button></Link>
            <Link href="/dashboard/documents"><Button variant="outline" className="w-full">Document Center</Button></Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
