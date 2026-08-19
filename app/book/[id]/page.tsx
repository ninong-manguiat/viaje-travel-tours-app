"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPackage } from "@/lib/sample-data";
import { formatPeso } from "@/lib/utils";

const steps = ["Package", "Travelers", "Add-ons", "Review", "Payment"];

export default function BookingWizardPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pkg = getPackage(params.id);
  const [step, setStep] = useState(0);
  const [adults, setAdults] = useState(2);
  const [addons, setAddons] = useState<string[]>([]);
  const total = useMemo(() => adults * pkg.pricing.adult + pkg.addons.filter((item) => addons.includes(item.id)).reduce((sum, item) => sum + item.price, 0), [adults, addons, pkg]);

  function submit() {
    router.push(`/book/booking-001/payment?packageId=${pkg.id}&departureId=${searchParams.get("departureId") ?? ""}`);
  }

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="font-semibold text-viaje-red">Guest Checkout</p>
        <h1 className="text-3xl font-bold text-viaje-navy">{pkg.title}</h1>
      </div>
      <div className="mb-8 grid gap-2 md:grid-cols-5">
        {steps.map((label, index) => (
          <button key={label} className={`rounded-md border px-3 py-2 text-sm font-semibold ${index <= step ? "border-viaje-navy bg-viaje-navy text-white" : "bg-white"}`} onClick={() => index <= step && setStep(index)}>
            {index + 1}. {label}
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader><CardTitle>{steps[step]}</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {step === 0 && <p>{pkg.description}</p>}
            {step === 1 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium">Adults</label>
                <Input type="number" min={1} value={adults} onChange={(event) => setAdults(Number(event.target.value))} />
                {Array.from({ length: adults }).map((_, index) => (
                  <div key={index} className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
                    <Input placeholder={`Traveler ${index + 1} full name`} />
                    <Input type="date" />
                    <Input placeholder="Email" />
                    <Input placeholder="Mobile" />
                    <Input placeholder="Nationality" />
                    <Input placeholder="Passport number, if required" />
                  </div>
                ))}
              </div>
            )}
            {step === 2 && (
              <div className="space-y-3">
                {pkg.addons.map((addon) => (
                  <label key={addon.id} className="flex items-center justify-between rounded-lg border p-4">
                    <span><input type="checkbox" className="mr-2" onChange={(event) => setAddons((current) => event.target.checked ? [...current, addon.id] : current.filter((id) => id !== addon.id))} />{addon.label}</span>
                    <strong>{formatPeso(addon.price)}</strong>
                  </label>
                ))}
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <p className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" />Review traveler count, add-ons, and total before proceeding.</p>
                <label className="flex gap-2 text-sm"><input type="checkbox" /> I confirm the booking details are correct.</label>
              </div>
            )}
            {step === 4 && <p>You will be redirected to the manual QR payment instruction page after submission.</p>}
            <div className="flex justify-end">
              {step < 4 ? <Button onClick={() => setStep(step + 1)}>Continue</Button> : <Button onClick={submit}>Create Booking</Button>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Cost Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span>Adults x {adults}</span><strong>{formatPeso(adults * pkg.pricing.adult)}</strong></div>
            <div className="flex justify-between"><span>Add-ons</span><strong>{formatPeso(total - adults * pkg.pricing.adult)}</strong></div>
            <div className="border-t pt-3 flex justify-between text-lg"><span>Total</span><strong>{formatPeso(total)}</strong></div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
