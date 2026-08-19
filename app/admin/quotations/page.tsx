import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { quotations } from "@/lib/sample-data";
import { formatDate, formatPeso } from "@/lib/utils";

export default function AdminQuotationsPage() {
  return (
    <AdminShell>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-semibold text-viaje-red">Sales</p>
          <h1 className="text-3xl font-bold text-viaje-navy">Quotations</h1>
        </div>
        <Link href="/admin/transactions/new"><Button>Create Quotation</Button></Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sent Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Quotation</TH>
                <TH>Package</TH>
                <TH>Total</TH>
                <TH>Valid Until</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {quotations.map((quotation) => (
                <TR key={quotation.id}>
                  <TD>{quotation.quotationNumber}</TD>
                  <TD>{quotation.packageId ?? "Custom trip"}</TD>
                  <TD>{formatPeso(quotation.total)}</TD>
                  <TD>{formatDate(quotation.validUntil)}</TD>
                  <TD><StatusBadge status={quotation.status} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
