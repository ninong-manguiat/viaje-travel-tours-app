import { Suspense } from "react";
import { BookingManagement } from "@/components/admin/booking-management";
import { AdminShell } from "@/components/layout/admin-shell";

export default function AdminBookingsPage() {
  return (
    <AdminShell>
      <Suspense fallback={<div className="p-6 text-sm text-viaje-soft">Loading bookings...</div>}>
        <BookingManagement />
      </Suspense>
    </AdminShell>
  );
}
