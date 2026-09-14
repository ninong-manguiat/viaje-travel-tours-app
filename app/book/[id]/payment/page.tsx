import { notFound } from "next/navigation";
import { BookingPaymentClient } from "@/components/domain/booking-payment-client";
import { listPaymentMethods } from "@/lib/payment-methods";
import { getPublicBooking } from "@/lib/public-bookings";

export const dynamic = "force-dynamic";

export default async function PaymentPage({ params }: { params: { id: string } }) {
  const current = await getPublicBooking(params.id);
  if (!current) notFound();
  if (current.summary.remainingBalance <= 0) notFound();

  const paymentMethods = await listPaymentMethods();
  return (
    <BookingPaymentClient
      booking={current.booking}
      remainingBalance={current.summary.remainingBalance}
      paymentMethods={paymentMethods}
      token={params.id}
    />
  );
}
