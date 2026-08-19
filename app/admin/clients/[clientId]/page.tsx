import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { bookings } from "@/lib/sample-data";
import { formatPeso } from "@/lib/utils";

export default function ClientProfilePage() {
  return (
    <AdminShell>
      <div className="mb-8 flex items-start justify-between">
        <div><p className="font-semibold text-viaje-red">Client Profile</p><h1 className="text-3xl font-bold text-viaje-navy">Juan Dela Cruz</h1></div>
        <div className="flex gap-2"><Button>Send Login Link</Button><Button variant="outline">Create Booking</Button></div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p>Total bookings</p><strong className="text-2xl">{bookings.length}</strong></CardContent></Card>
        <Card><CardContent className="p-5"><p>Outstanding balance</p><strong className="text-2xl">{formatPeso(bookings.reduce((sum, item) => sum + item.balance, 0))}</strong></CardContent></Card>
        <Card><CardContent className="p-5"><p>Documents pending</p><strong className="text-2xl">2</strong></CardContent></Card>
      </div>
    </AdminShell>
  );
}
