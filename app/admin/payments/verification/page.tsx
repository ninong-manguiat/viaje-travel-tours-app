import { AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { bookings, payments } from "@/lib/sample-data";
import { formatDate, formatPeso } from "@/lib/utils";

export default function PaymentVerificationPage() {
  return (
    <AdminShell>
      <div className="mb-8">
        <p className="font-semibold text-viaje-red">Payments</p>
        <h1 className="text-3xl font-bold text-viaje-navy">Verification Queue</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Submitted Proofs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Reference</TH>
                <TH>Booking</TH>
                <TH>Method</TH>
                <TH>Submitted</TH>
                <TH>Expected</TH>
                <TH>Status</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {payments.map((payment) => {
                const booking = bookings.find((item) => item.id === payment.bookingId);

                return (
                  <TR key={payment.id}>
                    <TD>{payment.referenceNumber}</TD>
                    <TD>{booking?.reference ?? payment.bookingId}</TD>
                    <TD className="capitalize">{payment.method}</TD>
                    <TD>
                      <div className="font-medium">{formatPeso(payment.amountSubmitted)}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(payment.paymentDate)}</div>
                    </TD>
                    <TD>{formatPeso(payment.amountExpected)}</TD>
                    <TD><StatusBadge status={payment.status} /></TD>
                    <TD>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm"><CheckCircle2 className="h-4 w-4" />Approve</Button>
                        <Button size="sm" variant="outline"><AlertTriangle className="h-4 w-4" />Reject</Button>
                        <Button size="sm" variant="outline"><RotateCcw className="h-4 w-4" />Partial</Button>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
