import { PackageEditor } from "@/components/admin/package-editor";
import { AdminShell } from "@/components/layout/admin-shell";

export default function PackageEditorPage({ params }: { params: { packageId: string } }) {
  return (
    <AdminShell>
      <PackageEditor packageId={params.packageId} />
    </AdminShell>
  );
}
