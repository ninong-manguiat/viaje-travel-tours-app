import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getPackageById } from "@/lib/package-data";
import { getPublicBooking } from "@/lib/public-bookings";
import { formatDate, formatPeso } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BookingDetailsPage({ params }: { params: { bookingId: string } }) {
  const current = await getPublicBooking(params.bookingId);
  if (!current) notFound();

  const { booking, payments, summary } = current;
  const pkg = booking.packageId ? await getPackageById(booking.packageId) : null;
  const contactName = [booking.groupContact.firstName, booking.groupContact.lastName]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ");

  return (
    <main className="container-page py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-viaje-red">{booking.reference}</p>
          <h1 className="text-3xl font-bold text-viaje-navy">{booking.packageTitle || pkg?.title || "Booking Details"}</h1>
          {contactName && <p className="mt-2 text-sm text-viaje-soft">Prepared for {contactName}</p>}
        </div>
        {booking.status && <StatusBadge status={booking.status} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Booking Details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 text-sm md:grid-cols-2">
              <p><span className="text-viaje-soft">Booking Reference</span><br /><strong className="text-viaje-navy">{booking.reference}</strong></p>
              <p><span className="text-viaje-soft">Package</span><br /><strong className="text-viaje-navy">{booking.packageTitle || pkg?.title || "N/A"}</strong></p>
              <p><span className="text-viaje-soft">Created</span><br /><strong className="text-viaje-navy">{booking.createdAt ? formatDate(booking.createdAt) : "N/A"}</strong></p>
              <p><span className="text-viaje-soft">Payment Status</span><br /><StatusBadge status={booking.paymentStatus || "for_verification"} /></p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>Payment</TH>
                    <TH>Amount</TH>
                    <TH>Method</TH>
                    <TH>Date</TH>
                    <TH>Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {!payments.length && <TR><TD colSpan={5}>No payment submissions yet.</TD></TR>}
                  {payments.map((payment) => (
                    <TR key={payment.id}>
                      <TD>{payment.paymentName}</TD>
                      <TD>{formatPeso(payment.amountSubmitted)}</TD>
                      <TD>{payment.method || "N/A"}</TD>
                      <TD>{payment.paymentDate ? formatDate(payment.paymentDate) : "N/A"}</TD>
                      <TD><StatusBadge status={payment.status} /></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:sticky lg:top-8 lg:self-start">
          <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span>Total Booking Amount</span><strong className="text-viaje-navy">{formatPeso(summary.totalAmount)}</strong></div>
              <div className="flex justify-between gap-4"><span>Total Paid</span><strong className="text-viaje-navy">{formatPeso(summary.totalPaid)}</strong></div>
              <div className="border-t border-viaje-line pt-3">
                <div className="flex justify-between gap-4 text-lg"><span className="font-semibold text-viaje-navy">Remaining Balance</span><strong className="text-viaje-navy">{formatPeso(summary.remainingBalance)}</strong></div>
              </div>
            </div>

            {summary.remainingBalance > 0 ? (
              <Link href={`/book/${encodeURIComponent(params.bookingId)}/payment`}>
                <Button className="w-full">Make a Payment</Button>
              </Link>
            ) : (
              <div className="rounded-[10px] border border-viaje-line bg-viaje-paperAlt p-4 text-sm font-semibold text-viaje-green">
                This booking is fully paid.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
