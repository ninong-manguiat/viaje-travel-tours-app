import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPackage } from "@/lib/sample-data";

export default function PackageEditorPage({ params }: { params: { packageId: string } }) {
  const pkg = getPackage(params.packageId);
  return (
    <AdminShell>
      <div className="mb-8 flex justify-between">
        <h1 className="text-3xl font-bold text-viaje-navy">Package Editor</h1>
        <Button>Save Package</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Basic Info, Schedule, Pricing, Flight, Hotel, Itinerary, Conditions</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Input defaultValue={pkg.title} />
          <Input defaultValue={pkg.destination} />
          <Input defaultValue={pkg.duration} />
          <Input defaultValue={String(pkg.pricing.adult)} />
          <Input defaultValue="Cover image upload to R2" />
          <Input defaultValue="Brochure PDF upload to R2" />
        </CardContent>
      </Card>
    </AdminShell>
  );
}
