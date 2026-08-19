"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdTokenResult(true);
      document.cookie = `viaje-role=${token.claims.role ?? "client"}; path=/; max-age=86400`;
      router.push(token.claims.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      setMessage("Unable to sign in. Check credentials and Firebase config.");
    }
  }

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <section className="flex items-center bg-viaje-navy p-10 text-white">
        <div><p className="font-semibold text-red-200">Welcome back</p><h1 className="mt-3 text-4xl font-bold">Viaje Travel and Tours</h1></div>
      </section>
      <section className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Login</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <Input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
              <Input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
              {message && <p className="text-sm text-red-600">{message}</p>}
              <Button className="w-full">Sign In</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
