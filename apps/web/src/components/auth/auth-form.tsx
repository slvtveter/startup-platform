"use client";

import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { FieldError } from "@/components/auth/auth-card";
import { PublishCheck, TermsNote, type TermsState } from "@/components/auth/terms-checks";
import { CodeStep } from "@/components/auth/code-step";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, register, verifyCode } from "@/lib/api";
import { apiCode, errorMessage, fieldErrors } from "@/lib/errors";
import { goal } from "@/lib/metrika";

// Частые опечатки в доменах почты: письмо с кодом ушло бы в никуда, а человек решил бы, что сайт сломан.
const DOMAIN_FIXES: Record<string, string> = {
  "gmial.com": "gmail.com", "gmal.com": "gmail.com", "gmai.com": "gmail.com", "gmail.co": "gmail.com", "gmail.con": "gmail.com",
  "gmail.ru": "gmail.com", "gamil.com": "gmail.com", "gnail.com": "gmail.com",
  "yandex.ri": "yandex.ru", "yandex.ry": "yandex.ru", "yandx.ru": "yandex.ru", "yadex.ru": "yandex.ru", "yandex.com.ru": "yandex.ru",
  "mail.ri": "mail.ru", "mail.ry": "mail.ru", "mial.ru": "mail.ru", "maill.ru": "mail.ru", "mail.ru.ru": "mail.ru",
  "inbox.ri": "inbox.ru", "bk.ri": "bk.ru", "list.ri": "list.ru", "rambler.ri": "rambler.ru",
  "outlook.co": "outlook.com", "hotmail.co": "hotmail.com", "icloud.co": "icloud.com",
};

/** «ivan@gmial.com» → «ivan@gmail.com»; без известной опечатки — null. */
export function emailFix(email: string): string | null {
  const [user, domain] = email.trim().toLowerCase().split("@");
  if (!user || !domain) return null;
  const fixed = DOMAIN_FIXES[domain];
  return fixed ? `${user}@${fixed}` : null;
}

export function safeNext(next: string | null, fallback: string) {
  // Только пути своего сайта: защищаемся от открытого редиректа. «//evil.com», «/\\evil.com»
  // (браузер читает обратный слэш как прямой) и управляющие символы не пропускаем.
  if (!next || !next.startsWith("/") || next.startsWith("//") || /[\\\u0000-\u001f]/.test(next)) return fallback;
  try {
    const url = new URL(next, "https://envola.invalid");
    return url.origin === "https://envola.invalid" ? url.pathname + url.search + url.hash : fallback;
  } catch {
    return fallback;
  }
}

/** Переход после входа: пока грузится следующая страница, показываем «Входим…», а не замершую кнопку. */
export function useSignedIn() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [, startTransition] = useTransition();
  function go(href: string) {
    setDone(true);
    startTransition(() => {
      router.replace(href);
      router.refresh();
    });
  }
  return { done, go };
}

/** Экран между формой и следующей страницей: галочка и «Входим в аккаунт». */
export function SignedIn({ title = "Готово" }: { title?: string }) {
  return (
    <div role="status" className="grid justify-items-center gap-4 py-6 text-center">
      <span className="auth-pop grid size-16 place-items-center rounded-full bg-brand text-white">
        <Check className="size-8" strokeWidth={3} aria-hidden />
      </span>
      <div>
        <p className="text-xl font-extrabold tracking-[-0.02em]">{title}</p>
        <p className="mt-1 inline-flex items-center gap-2 text-muted-foreground">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          Входим в аккаунт…
        </p>
      </div>
    </div>
  );
}


/**
 * Вход и регистрация по почте. Регистрация — в два шага: почта и пароль, потом код из письма,
 * без кода аккаунт не открыть. Вход с неподтверждённой почтой тоже уводит на шаг с кодом.
 */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [step, setStep] = useState<"form" | "code">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [consent, setConsent] = useState<TermsState>({ publish: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const { done, go } = useSignedIn();

  // Страница после входа подгружается заранее, пока человек вводит пароль.
  useEffect(() => {
    router.prefetch(safeNext(next, mode === "register" ? "/welcome" : "/"));
  }, [router, next, mode]);

  /** Свои понятные сообщения вместо всплывающих подсказок браузера (они на языке браузера и пропадают). */
  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Проверь адрес: нужен вид name@mail.ru";
    if (mode === "register" && password.length < 8) errs.password = "Пароль короче 8 символов";
    if (mode === "login" && !password) errs.password = "Введи пароль";
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
    const body = { email: email.trim(), password };
    if (mode === "login") {
      const res = await login({ body });
      if (!res.error) return go(safeNext(next, "/"));
      setBusy(false);
      if (apiCode(res.error) === "email_unverified") return setStep("code");
      setFields(fieldErrors(res.error));
      setError(errorMessage(res.error));
      return;
    }
    const res = await register({ body: { ...body, accept_terms: true, adult: true, publish_consent: consent.publish, utm_source: params.get("utm_source") || params.get("ref") || null } });
    setBusy(false);
    if (res.error) {
      setFields(fieldErrors(res.error));
      setError(errorMessage(res.error));
      return;
    }
    setStep("code");
  }

  async function confirm(code: string) {
    const { data, error: err } = await verifyCode({ body: { email: email.trim(), code } });
    if (err || !data) return errorMessage(err);
    if (data.created) goal("signup", { method: "email" });
    go(safeNext(next, data.created ? "/welcome" : "/"));
    return null;
  }

  if (done) return <SignedIn title={mode === "register" ? "Почта подтверждена" : "Готово"} />;
  if (step === "code") {
    return (
      <CodeStep email={email.trim()} purpose="verify" onBack={() => setStep("form")} onSubmit={confirm} submitLabel={mode === "register" ? "Создать аккаунт" : "Войти"} />
    );
  }

  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <form onSubmit={submit} noValidate className="grid gap-4" aria-busy={busy}>
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
          aria-invalid={!!fields.email}
          aria-describedby={fields.email ? "email-error" : undefined}
          className="mt-1.5 h-11"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FieldError id="email-error" message={fields.email} />
        {mode === "register" && emailFix(email) && (
          <p className="mt-1.5 text-sm text-warn-ink">
            Возможно, {emailFix(email)}?{" "}
            <button type="button" onClick={() => setEmail(emailFix(email)!)} className="font-semibold underline underline-offset-2">
              Исправить
            </button>
          </p>
        )}
      </div>
      <div>
        <div className="flex items-baseline">
          <Label htmlFor="password">Пароль</Label>
          {mode === "login" && (
            <Link href={`/forgot-password${email ? `?email=${encodeURIComponent(email.trim())}` : ""}`} className="ml-auto text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
              Забыли пароль?
            </Link>
          )}
        </div>
        <div className="relative mt-1.5">
          <Input
            id="password"
            type={show ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            disabled={busy}
            minLength={mode === "register" ? 8 : 1}
            aria-invalid={!!fields.password}
            aria-describedby={fields.password ? "password-error" : mode === "register" ? "password-hint" : undefined}
            className="h-11 pr-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Скрыть пароль" : "Показать пароль"}
            aria-pressed={show}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground"
          >
            {show ? <EyeOff aria-hidden className="size-[18px]" /> : <Eye aria-hidden className="size-[18px]" />}
          </button>
        </div>
        {mode === "register" && !fields.password && (
          <p id="password-hint" className="mt-1 text-xs text-muted-foreground">
            Минимум 8 символов
          </p>
        )}
        <FieldError id="password-error" message={fields.password} />
      </div>
      {mode === "register" && <PublishCheck value={consent} onChange={setConsent} />}
      {error && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {error}
          {mode === "register" && error.includes("уже есть") && (
            <>
              {" "}
              <Link href={`/login${nextQuery}`} className="font-bold underline underline-offset-2">
                Войти
              </Link>
            </>
          )}
        </p>
      )}
      <Button type="submit" variant="brand" size="lg" disabled={busy} aria-busy={busy}>
        {busy ? (
          <>
            <Loader2 aria-hidden className="size-5 animate-spin" />
            {mode === "login" ? "Проверяем…" : "Отправляем код…"}
          </>
        ) : mode === "login" ? (
          "Войти"
        ) : (
          "Получить код на почту"
        )}
      </Button>
      {mode === "register" && <TermsNote action="Получить код на почту" />}
    </form>
  );
}
