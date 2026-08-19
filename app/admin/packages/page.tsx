import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { packages } from "@/lib/sample-data";

export default function AdminPackagesPage() {
  return (
    <AdminShell>
      <div className="mb-8 flex justify-between">
        <h1 className="text-3xl font-bold text-viaje-navy">Packages</h1>
        <Link href="/admin/packages/new/edit"><Button>New Package</Button></Link>
      </div>
      <Card>
        <CardHeader><CardTitle>Package Management</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead><TR><TH>Title</TH><TH>Destination</TH><TH>Status</TH><TH /></TR></THead>
            <TBody>{packages.map((pkg) => <TR key={pkg.id}><TD>{pkg.title}</TD><TD>{pkg.destination}</TD><TD><StatusBadge status={pkg.status} /></TD><TD><Link href={`/admin/packages/${pkg.id}/edit`}><Button size="sm" variant="outline">Edit</Button></Link></TD></TR>)}</TBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
