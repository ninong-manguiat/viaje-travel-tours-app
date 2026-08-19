import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

const clients = [{ id: "client-001", name: "Juan Dela Cruz", email: "juan@example.com", mobile: "+63 917 000 0000", status: "active" }];

export default function ClientsPage() {
  return (
    <AdminShell>
      <h1 className="mb-8 text-3xl font-bold text-viaje-navy">Clients</h1>
      <Card>
        <CardHeader><CardTitle>Client Management</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead><TR><TH>Name</TH><TH>Email</TH><TH>Mobile</TH><TH>Status</TH><TH /></TR></THead>
            <TBody>{clients.map((client) => <TR key={client.id}><TD>{client.name}</TD><TD>{client.email}</TD><TD>{client.mobile}</TD><TD><StatusBadge status={client.status} /></TD><TD><Link href={`/admin/clients/${client.id}`}><Button size="sm" variant="outline">Open</Button></Link></TD></TR>)}</TBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
