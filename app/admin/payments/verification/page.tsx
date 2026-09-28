import { AdminShell } from "@/components/layout/admin-shell";
import { PaymentVerificationManagement } from "@/components/admin/payment-verification-management";

export const dynamic = "force-dynamic";

export default function PaymentVerificationPage() {
  return (
    <AdminShell>
      <PaymentVerificationManagement />
    </AdminShell>
  );
}
