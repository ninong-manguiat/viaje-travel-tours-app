import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function NewTransactionPage() {
  return (
    <AdminShell>
      <h1 className="mb-8 text-3xl font-bold text-viaje-navy">Create Transaction</h1>
      <Card>
        <CardHeader><CardTitle>Staff Transaction Form</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Input placeholder="Source: Phone / Messenger / Walk-in" />
          <Input placeholder="Customer name or email" />
          <Input placeholder="Package or custom service" />
          <Input placeholder="Payment terms" />
          <Input placeholder="Discount authorized by" />
          <Input placeholder="Internal notes" />
          <div className="flex gap-3 md:col-span-2">
            <Button>Generate Quotation</Button>
            <Button variant="outline">Create Transaction</Button>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
