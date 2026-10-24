"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await forgotPassword({ body: { email } });
    if (error) return setError(errorMessage(error));
    setSent(true);
  }

  if (sent)
    return (
      <p className="rounded-xl bg-success-soft p-4 text-sm text-success-ink">
        Если такой аккаунт есть, мы отправили письмо со ссылкой. Она действует 1 час.
      </p>
    );
  return (
    <form onSubmit={submit} className="grid gap-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required className="mt-1.5 h-11" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg">
        Отправить ссылку
      </Button>
    </form>
  );
}
