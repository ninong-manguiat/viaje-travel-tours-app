"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const auth = getFirebaseAuth();
    await sendPasswordResetEmail(auth, email);
    setSent(true);
  }

  return (
    <main className="container-page flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Forgot Password</CardTitle></CardHeader>
        <CardContent>
          {sent ? <p>Check your inbox for password reset instructions.</p> : (
            <form className="space-y-4" onSubmit={submit}>
              <Input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
              <Button className="w-full">Send Reset Email</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
