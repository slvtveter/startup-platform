"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { FieldError } from "@/components/auth/auth-card";
import { SignedIn, useSignedIn } from "@/components/auth/auth-form";
import { CodeStep } from "@/components/auth/code-step";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword, resetPasswordWithCode } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

/** Сброс пароля: почта → код из письма и новый пароль → сразу вошёл. */
export function ForgotForm() {
  const params = useSearchParams();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { done, go } = useSignedIn();

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Проверь адрес: нужен вид name@mail.ru");
      return;
    }
    setBusy(true);
    setError("");
    const { error: err } = await forgotPassword({ body: { email: email.trim() } });
    setBusy(false);
    if (err) return setError(errorMessage(err));
    setStep("code");
  }

  async function reset(code: string) {
    if (password.length < 8) {
      setPasswordError("Пароль короче 8 символов");
      document.getElementById("new-password")?.focus();
      return "Сначала придумай новый пароль";
    }
    setPasswordError("");
    const { error: err } = await resetPasswordWithCode({ body: { email: email.trim(), code, password } });
    if (err) return errorMessage(err);
    go("/");
    return null;
  }

  if (done) return <SignedIn title="Пароль обновлён" />;
  if (step === "code") {
    return (
      <CodeStep email={email.trim()} purpose="reset" onBack={() => setStep("email")} onSubmit={reset} submitLabel="Сохранить пароль и войти" autoSubmit={false}>
        <div>
          <Label htmlFor="new-password">Новый пароль</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? "new-password-error" : "new-password-hint"}
            className="mt-1.5 h-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {passwordError ? (
            <FieldError id="new-password-error" message={passwordError} />
          ) : (
            <p id="new-password-hint" className="mt-1 text-xs text-muted-foreground">
              Минимум 8 символов. На других устройствах выйдем из аккаунта.
            </p>
          )}
        </div>
      </CodeStep>
    );
  }
  return (
    <form onSubmit={send} noValidate className="grid gap-4" aria-busy={busy}>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoFocus
          required
          disabled={busy}
          aria-invalid={!!error}
          aria-describedby={error ? "email-error" : undefined}
          className="mt-1.5 h-11"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FieldError id="email-error" message={error} />
      </div>
      <Button type="submit" variant="brand" size="lg" disabled={busy} aria-busy={busy}>
        {busy ? (
          <>
            <Loader2 aria-hidden className="size-5 animate-spin" />
            Отправляем код…
          </>
        ) : (
          "Получить код"
        )}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Вспомнил пароль?{" "}
        <Link href="/login" className="font-bold text-foreground">
          Войти
        </Link>
      </p>
    </form>
  );
}
