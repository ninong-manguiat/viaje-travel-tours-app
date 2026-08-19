import { FileUp } from "lucide-react";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const docs = [
  { label: "Passport bio page", status: "submitted" },
  { label: "PSA birth certificate", status: "required" },
  { label: "Bank certificate", status: "under_review" }
];

export default function DocumentsPage() {
  return (
    <main className="container-page py-10">
      <h1 className="mb-8 text-3xl font-bold text-viaje-navy">Visa and Document Center</h1>
      <Card>
        <CardHeader><CardTitle>Japan Visa Application</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {docs.map((doc) => (
            <div key={doc.label} className="flex items-center justify-between rounded-lg border p-4">
              <div><p className="font-semibold">{doc.label}</p><StatusBadge status={doc.status} /></div>
              <Button variant="outline"><FileUp className="h-4 w-4" />{doc.status === "required" ? "Upload" : "View"}</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
