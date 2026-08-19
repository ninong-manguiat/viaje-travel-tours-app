import Link from "next/link";
import { FileUp, MessageCircle, ReceiptText, WalletCards } from "lucide-react";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bookings, getPackage, payments } from "@/lib/sample-data";
import { formatPeso } from "@/lib/utils";

export default function DashboardPage() {
  const balance = bookings.reduce((sum, item) => sum + item.balance, 0);
  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="font-semibold text-viaje-red">Client Dashboard</p>
        <h1 className="text-3xl font-bold text-viaje-navy">My Trips</h1>
      </div>
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Upcoming trips</p><strong className="text-2xl">{bookings.length}</strong></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Outstanding balance</p><strong className="text-2xl">{formatPeso(balance)}</strong></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Documents required</p><strong className="text-2xl">3</strong></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Recent payments</p><strong className="text-2xl">{payments.length}</strong></CardContent></Card>
      </div>
      <div className="mb-8 flex flex-wrap gap-3">
        <Link href="/book/booking-001/payment"><Button><WalletCards className="h-4 w-4" />Submit Payment</Button></Link>
        <Link href="/dashboard/documents"><Button variant="outline"><FileUp className="h-4 w-4" />Upload Documents</Button></Link>
        <Link href="/dashboard/transactions"><Button variant="outline"><ReceiptText className="h-4 w-4" />Transactions</Button></Link>
        <Button variant="outline"><MessageCircle className="h-4 w-4" />Contact Viaje</Button>
      </div>
      <div className="grid gap-5">
        {bookings.map((booking) => {
          const pkg = getPackage(booking.packageId);
          return (
            <Card key={booking.id}>
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <img src={pkg.coverImageUrl} alt={pkg.title} className="h-20 w-28 rounded-md object-cover" />
                  <div>
                    <h2 className="font-semibold">{pkg.title}</h2>
                    <p className="text-sm text-muted-foreground">{booking.reference}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2"><StatusBadge status={booking.status} /><StatusBadge status={booking.paymentStatus} /></div>
                <Link href={`/dashboard/bookings/${booking.id}`}><Button variant="outline">View Booking</Button></Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
