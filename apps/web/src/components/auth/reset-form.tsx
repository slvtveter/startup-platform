"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

export function ResetForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await resetPassword({ body: { token, password } });
    if (error) return setError(errorMessage(error));
    setDone(true);
  }

  if (done)
    return (
      <div className="grid gap-4">
        <p className="rounded-xl bg-success-soft p-4 text-sm text-success-ink">Пароль обновлён. Все старые сессии завершены.</p>
        <Link href="/login" className={buttonVariants({ size: "lg" })}>
          Войти
        </Link>
      </div>
    );
  return (
    <form onSubmit={submit} className="grid gap-4">
      <div>
        <Label htmlFor="password">Новый пароль</Label>
        <Input id="password" type="password" minLength={8} required className="mt-1.5 h-11" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg">
        Сохранить пароль
      </Button>
    </form>
  );
}
