import { AdminShell } from "@/components/layout/admin-shell";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { bookings } from "@/lib/sample-data";
import { formatPeso } from "@/lib/utils";

export default function AdminBookingDetailPage({ params }: { params: { bookingId: string } }) {
  const booking = bookings.find((item) => item.id === params.bookingId) ?? bookings[0];
  return (
    <AdminShell>
      <div className="mb-8 flex items-start justify-between">
        <div><p className="font-semibold text-viaje-red">{booking.reference}</p><h1 className="text-3xl font-bold text-viaje-navy">Booking Management</h1></div>
        <StatusBadge status={booking.status} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input defaultValue={booking.status} />
            <Input defaultValue="Internal staff notes" />
            <Input defaultValue="Send payment link" />
            <Input defaultValue="Request document" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Balance Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold">{formatPeso(booking.balance)}</p>
            <Button className="w-full">Send Email</Button>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
