import { AdminShell } from "@/components/layout/admin-shell";
import { QuotationBuilderManagement } from "@/components/admin/quotation-builder-management";

export default function AdminQuotationsPage() {
  return (
    <AdminShell>
      <QuotationBuilderManagement />
    </AdminShell>
  );
}
