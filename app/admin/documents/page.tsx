import { FileCheck2, Send } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { bookings } from "@/lib/sample-data";

export default function AdminDocumentsPage() {
  return (
    <AdminShell>
      <div className="mb-8">
        <p className="font-semibold text-viaje-red">Client Documents</p>
        <h1 className="text-3xl font-bold text-viaje-navy">Document Management</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Active Checklists</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Booking</TH>
                <TH>Checklist</TH>
                <TH>Progress</TH>
                <TH>Pending</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {bookings.map((booking) => (
                <TR key={booking.id}>
                  <TD>{booking.reference}</TD>
                  <TD>{booking.packageId.includes("japan") ? "Japan Visa Application" : "Travel Requirements"}</TD>
                  <TD>2 / 3 submitted</TD>
                  <TD>Passport bio page</TD>
                  <TD>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm"><FileCheck2 className="h-4 w-4" />Review</Button>
                      <Button size="sm" variant="outline"><Send className="h-4 w-4" />Reminder</Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
