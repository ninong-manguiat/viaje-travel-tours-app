import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ActivatePage({ params }: { params: { token: string } }) {
  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <section className="flex items-center bg-viaje-navy p-10 text-white">
        <div>
          <p className="font-semibold text-viaje-red">Invited by Viaje</p>
          <h1 className="mt-3 text-4xl font-bold">Activate your travel account</h1>
          <p className="mt-4 text-slate-200">Token preview: {params.token}</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Set Password</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input value="client@example.com" readOnly />
            <Input type="password" placeholder="Create password" />
            <Button className="w-full">Activate Account</Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
