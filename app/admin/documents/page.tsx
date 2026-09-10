import { DocumentBinManagement } from "@/components/admin/document-bin-management";
import { AdminShell } from "@/components/layout/admin-shell";

export default function AdminDocumentsPage() {
  return (
    <AdminShell>
      <DocumentBinManagement />
    </AdminShell>
  );
}
