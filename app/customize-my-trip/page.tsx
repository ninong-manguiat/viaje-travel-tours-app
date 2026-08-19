import { Send } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const serviceOptions = ["Flights", "Hotels", "Tours", "Visa assistance", "Travel insurance", "Transfers"];

export default function CustomizeMyTripPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-page py-10">
        <div className="mb-8 max-w-3xl">
          <p className="font-semibold text-viaje-red">Custom Trip</p>
          <h1 className="text-3xl font-bold text-viaje-navy">Plan a Trip Around Your Dates</h1>
          <p className="mt-2 text-muted-foreground">Send the trip details Viaje needs to prepare a practical quotation for your group.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Travel Request</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Destination" />
            <Input placeholder="Preferred travel dates" />
            <Input type="number" min={1} placeholder="Number of travelers" />
            <Input placeholder="Budget range" />
            <Input placeholder="Full name" />
            <Input placeholder="Mobile number" />
            <Input type="email" placeholder="Email address" />
            <Input placeholder="Travel type: family, company, barkada" />
            <div className="space-y-3 md:col-span-2">
              <p className="text-sm font-medium">Services needed</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {serviceOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <input type="checkbox" />
                    {option}
                  </label>
                ))}
              </div>
            </div>
            <textarea className="min-h-28 rounded-md border border-input bg-white px-3 py-2 text-sm md:col-span-2" placeholder="Additional requirements" />
            <div className="md:col-span-2">
              <Button><Send className="h-4 w-4" />Submit Request</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
