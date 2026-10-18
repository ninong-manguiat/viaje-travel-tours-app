import { Suspense } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { QuotationBuilderManagement } from "@/components/admin/quotation-builder-management";

export default function AdminQuotationsPage() {
  return (
    <AdminShell>
      <Suspense fallback={<div className="p-6 text-sm text-viaje-soft">Loading quotations...</div>}>
        <QuotationBuilderManagement />
      </Suspense>
    </AdminShell>
  );
}
