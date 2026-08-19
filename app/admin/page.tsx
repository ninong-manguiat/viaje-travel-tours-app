import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { bookings, payments } from "@/lib/sample-data";
import { formatPeso } from "@/lib/utils";

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <div className="mb-8">
        <p className="font-semibold text-viaje-red">Operations</p>
        <h1 className="text-3xl font-bold text-viaje-navy">Admin Dashboard</h1>
      </div>
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">New bookings</p><strong className="text-2xl">{bookings.length}</strong></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Pending payments</p><strong className="text-2xl">{formatPeso(bookings.reduce((sum, item) => sum + item.balance, 0))}</strong></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">For verification</p><strong className="text-2xl">{payments.length}</strong></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Upcoming departures</p><strong className="text-2xl">4</strong></CardContent></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Payment Verification Queue</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead><TR><TH>Reference</TH><TH>Amount</TH><TH>Status</TH><TH /></TR></THead>
              <TBody>{payments.map((payment) => <TR key={payment.id}><TD>{payment.referenceNumber}</TD><TD>{formatPeso(payment.amountSubmitted)}</TD><TD><StatusBadge status={payment.status} /></TD><TD><Link href="/admin/payments/verification"><Button size="sm">Review</Button></Link></TD></TR>)}</TBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Client Activity</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Juan Dela Cruz uploaded passport - 10 minutes ago</p>
            <p>Maria Santos submitted GCash receipt - 1 hour ago</p>
            <p>Admin sent payment link - yesterday</p>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
