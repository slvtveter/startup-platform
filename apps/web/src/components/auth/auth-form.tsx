"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { FieldError } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, register } from "@/lib/api";
import { errorMessage, fieldErrors } from "@/lib/errors";

function safeNext(next: string | null, fallback: string) {
  // Только относительные пути: защищаемся от открытого редиректа.
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  /** Свои понятные сообщения вместо всплывающих подсказок браузера (они на языке браузера и пропадают). */
  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Проверь адрес: нужен вид name@mail.ru";
    if (mode === "register" && password.length < 8) errs.password = "Пароль короче 8 символов";
    if (mode === "login" && !password) errs.password = "Введи пароль";
    if (mode === "register" && !adult) errs.adult = "Подтверди, что тебе есть 18 лет и ты принимаешь условия";
    return errs;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setError("");
      setFields(errs);
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }
    setBusy(true);
    setError("");
    setFields({});
    const body = { email, password };
    const res =
      mode === "login"
        ? await login({ body })
        : await register({ body: { ...body, utm_source: params.get("utm_source") || params.get("ref") || null } });
    setBusy(false);
    if (res.error) {
      setFields(fieldErrors(res.error));
      setError(errorMessage(res.error));
      return;
    }
    const fallback = mode === "register" ? "/welcome" : "/";
    router.push(safeNext(params.get("next"), fallback));
    router.refresh();
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={!!fields.email}
          aria-describedby={fields.email ? "email-error" : undefined}
          className="mt-1.5 h-11"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FieldError id="email-error" message={fields.email} />
      </div>
      <div>
        <div className="flex items-baseline">
          <Label htmlFor="password">Пароль</Label>
          {mode === "login" && (
            <Link href="/forgot-password" className="ml-auto text-sm text-muted-foreground hover:text-foreground">
              Забыли пароль?
            </Link>
          )}
        </div>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={mode === "register" ? 8 : 1}
          aria-invalid={!!fields.password}
          aria-describedby={fields.password ? "password-error" : mode === "register" ? "password-hint" : undefined}
          className="mt-1.5 h-11"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {mode === "register" && !fields.password && (
          <p id="password-hint" className="mt-1 text-xs text-muted-foreground">
            Минимум 8 символов
          </p>
        )}
        <FieldError id="password-error" message={fields.password} />
      </div>
      {mode === "register" && (
        <div>
          <label className="flex gap-3 text-sm text-muted-foreground">
            <input
              id="adult"
              type="checkbox"
              required
              aria-invalid={!!fields.adult}
              aria-describedby={fields.adult ? "adult-error" : undefined}
              checked={adult}
              onChange={(e) => setAdult(e.target.checked)}
              className="mt-0.5 size-4 accent-[var(--brand)]"
            />
            Мне есть 18 лет, я принимаю условия сервиса
          </label>
          <FieldError id="adult-error" message={fields.adult} />
        </div>
      )}
      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" variant="brand" size="lg" disabled={busy}>
        {mode === "login" ? "Войти" : "Создать аккаунт"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            Нет аккаунта?{" "}
            <Link href={`/register${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`} className="font-bold text-foreground">
              Регистрация
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{" "}
            <Link href={`/login${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`} className="font-bold text-foreground">
              Войти
            </Link>
          </>
        )}
      </p>
      <p className="text-center text-xs text-muted-foreground">Бесплатно · без резюме · займёт минуту</p>
    </form>
  );
}
