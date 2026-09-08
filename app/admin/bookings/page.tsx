import { BookingManagement } from "@/components/admin/booking-management";
import { AdminShell } from "@/components/layout/admin-shell";

export default function AdminBookingsPage() {
  return (
    <AdminShell>
      <BookingManagement />
    </AdminShell>
  );
}
