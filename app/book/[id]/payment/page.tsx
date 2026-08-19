"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { bookings } from "@/lib/sample-data";
import { formatPeso } from "@/lib/utils";

export default function PaymentPage({ params }: { params: { id: string } }) {
  const [submitted, setSubmitted] = useState(false);
  const booking = bookings.find((item) => item.id === params.id) ?? bookings[0];

  return (
    <main className="container-page max-w-4xl py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-viaje-red">Manual Payment</p>
          <h1 className="text-3xl font-bold text-viaje-navy">{booking.reference}</h1>
        </div>
        <StatusBadge status="awaiting_payment" />
      </div>
      {submitted ? (
        <Card><CardContent className="p-6 text-lg">Submitting a receipt does not automatically confirm payment. Viaje will verify the transaction before marking the booking as paid.</CardContent></Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader><CardTitle>Amount Due</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-3xl font-bold">{formatPeso(booking.balance)}</p>
              <div className="rounded-lg bg-slate-100 p-6 text-center font-semibold">GCash / Maya / Bank QR Placeholder</div>
              <p className="text-sm text-muted-foreground">Upload proof after sending payment through your preferred manual channel.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Submit Payment for Verification</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Method: gcash, maya, or bank" />
              <Input type="number" placeholder="Amount paid" />
              <Input placeholder="Reference number" />
              <Input type="date" />
              <Input type="file" />
              <Input placeholder="Notes" />
              <Button className="w-full" onClick={() => setSubmitted(true)}>Submit Receipt</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
