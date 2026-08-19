import { PlaneTakeoff } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function FlightsPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="mb-8 max-w-3xl">
          <p className="font-semibold text-viaje-red">Flight Assistance</p>
          <h1 className="text-3xl font-bold text-viaje-navy">Request Flight Options</h1>
          <p className="mt-2 text-muted-foreground">Viaje staff can help check practical routes and fares while automated flight search is planned for a future phase.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Flight Inquiry</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Origin" />
            <Input placeholder="Destination" />
            <Input type="date" placeholder="Departure date" />
            <Input type="date" placeholder="Return date" />
            <Input type="number" min={1} placeholder="Passengers" />
            <Input placeholder="Preferred airline or schedule" />
            <div className="md:col-span-2">
              <Button><PlaneTakeoff className="h-4 w-4" />Send Inquiry</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
