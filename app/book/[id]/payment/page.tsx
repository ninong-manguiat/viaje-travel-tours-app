import { notFound } from "next/navigation";
import { BookingPaymentClient } from "@/components/domain/booking-payment-client";
import { listPaymentMethods } from "@/lib/payment-methods";
import { getPublicBooking } from "@/lib/public-bookings";

export const dynamic = "force-dynamic";

function selectedScheduleIds(value?: string | string[]) {
  const raw = Array.isArray(value) ? value.join(",") : value || "";
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

function isPayable(status?: string) {
  return ["pending", "unpaid", "rejected"].includes(String(status || "pending").toLowerCase());
}

export default async function PaymentPage({ params, searchParams }: { params: { id: string }; searchParams?: { schedules?: string | string[] } }) {
  const current = await getPublicBooking(params.id);
  if (!current) notFound();

  const requestedIds = selectedScheduleIds(searchParams?.schedules);
  const payableSchedules = current.booking.paymentSchedule.filter((item) => item.id && isPayable(item.status));
  const selectedSchedules = requestedIds.length
    ? payableSchedules.filter((item) => requestedIds.includes(String(item.id)))
    : payableSchedules;
  if (!selectedSchedules.length) notFound();

  const paymentMethods = await listPaymentMethods();
  return (
    <BookingPaymentClient
      booking={current.booking}
      remainingBalance={selectedSchedules.reduce((sum, item) => sum + Number(item.amount || 0), 0)}
      selectedSchedules={selectedSchedules}
      paymentMethods={paymentMethods}
      token={params.id}
    />
  );
}
