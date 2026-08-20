import { WebsiteContentEditor } from "@/components/admin/website-content-editor";
import { AdminShell } from "@/components/layout/admin-shell";

export default function AdminWebsiteContentPage() {
  return (
    <AdminShell>
      <WebsiteContentEditor />
    </AdminShell>
  );
}
