import { PaymentMethodManagement } from "@/components/admin/payment-method-management";
import { AdminShell } from "@/components/layout/admin-shell";

export default function AdminPaymentManagementPage() {
  return (
    <AdminShell>
      <PaymentMethodManagement />
    </AdminShell>
  );
}
