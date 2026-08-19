import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { bookings } from "@/lib/sample-data";
import { formatPeso } from "@/lib/utils";

export default function AdminBookingsPage() {
  return (
    <AdminShell>
      <h1 className="mb-8 text-3xl font-bold text-viaje-navy">Bookings</h1>
      <Card>
        <CardHeader><CardTitle>All Bookings</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead><TR><TH>Reference</TH><TH>Total</TH><TH>Balance</TH><TH>Status</TH><TH /></TR></THead>
            <TBody>{bookings.map((booking) => <TR key={booking.id}><TD>{booking.reference}</TD><TD>{formatPeso(booking.totalAmount)}</TD><TD>{formatPeso(booking.balance)}</TD><TD><StatusBadge status={booking.status} /></TD><TD><Link href={`/admin/bookings/${booking.id}`}><Button size="sm" variant="outline">Open</Button></Link></TD></TR>)}</TBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
