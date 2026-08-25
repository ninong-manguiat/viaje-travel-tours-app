import { PackageList } from "@/components/admin/package-list";
import { AdminShell } from "@/components/layout/admin-shell";

export default function AdminPackagesPage() {
  return (
    <AdminShell>
      <PackageList />
    </AdminShell>
  );
}
