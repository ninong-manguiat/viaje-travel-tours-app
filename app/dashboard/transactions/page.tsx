import { StatusBadge } from "@/components/domain/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { bookings } from "@/lib/sample-data";
import { formatPeso } from "@/lib/utils";

export default function TransactionsPage() {
  return (
    <main className="container-page py-10">
      <h1 className="mb-8 text-3xl font-bold text-viaje-navy">Transactions</h1>
      <Card>
        <CardHeader><CardTitle>Ledger</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead><TR><TH>Booking</TH><TH>Amount</TH><TH>Paid</TH><TH>Balance</TH><TH>Status</TH></TR></THead>
            <TBody>{bookings.map((booking) => <TR key={booking.id}><TD>{booking.reference}</TD><TD>{formatPeso(booking.totalAmount)}</TD><TD>{formatPeso(booking.amountPaid)}</TD><TD>{formatPeso(booking.balance)}</TD><TD><StatusBadge status={booking.paymentStatus} /></TD></TR>)}</TBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
