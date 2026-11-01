"use client";

import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { FieldError } from "@/components/auth/auth-card";
import { CodeInput } from "@/components/auth/code-input";
import { Button } from "@/components/ui/button";
import { resendCode } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

/** Повторное письмо — не раньше чем через минуту: первое обычно уже в пути. */
const RESEND_AFTER = 60;

/**
 * Шаг «Введи код из письма»: общий для регистрации, входа с неподтверждённой почтой и сброса пароля.
 * Код из шести цифр отправляется сам, как только введена последняя.
 */
export function CodeStep({
  email,
  purpose,
  onBack,
  onSubmit,
  children,
  submitLabel = "Подтвердить",
  autoSubmit = true,
}: {
  email: string;
  purpose: "verify" | "reset";
  onBack: () => void;
  /** Возвращает текст ошибки или null, если всё прошло. */
  onSubmit: (code: string) => Promise<string | null>;
  /** Доп. поля под кодом (новый пароль при сбросе). */
  children?: React.ReactNode;
  submitLabel?: string;
  autoSubmit?: boolean;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [left, setLeft] = useState(RESEND_AFTER);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  async function submit(value = code) {
    if (value.length !== 6) {
      setError("Введи все 6 цифр из письма");
      return;
    }
    setBusy(true);
    setError("");
    const err = await onSubmit(value);
    if (err) {
      setBusy(false);
      setError(err);
      // Неверный код выделяем: новый ввод заменит его. Фокус не уводим, если форма поставила его
      // в другое поле (короткий пароль при сбросе). Поле только что было disabled — ждём кадр.
      requestAnimationFrame(() => {
        const el = document.getElementById("code") as HTMLInputElement | null;
        if (el && (document.activeElement === document.body || document.activeElement === el)) {
          el.focus();
          el.select();
        }
      });
    }
    // Без ошибки форма уже показывает «Входим…» — busy не сбрасываем.
  }

  function change(value: string) {
    setCode(value);
    if (error) setError("");
    if (autoSubmit && value.length === 6) void submit(value);
  }

  async function resend() {
    setLeft(RESEND_AFTER);
    setResent(false);
    const { error: err } = await resendCode({ body: { email, purpose } });
    if (err) {
      setError(errorMessage(err));
      return;
    }
    setResent(true);
    setCode("");
    document.getElementById("code")?.focus();
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="wizard-step-forward grid gap-5"
    >
      <div className="flex gap-3 rounded-2xl bg-tone p-4">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-ink">
          <MailCheck className="size-5" />
        </span>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {resent ? "Отправили новый код на " : "Отправили код на "}
          <b className="font-bold whitespace-nowrap text-foreground">{email}</b>. Письмо приходит за минуту, если нет — загляни в «Спам».
        </p>
      </div>
      <div>
        <label htmlFor="code" className="mb-2 block text-sm font-semibold">
          Код из письма
        </label>
        <CodeInput
          id="code"
          value={code}
          onChange={change}
          invalid={!!error}
          disabled={busy}
          describedBy={error ? "code-error" : undefined}
        />
        <FieldError id="code-error" message={error} />
      </div>
      {children}
      <Button type="submit" variant="brand" size="lg" disabled={busy} aria-busy={busy}>
        {busy ? (
          <>
            <Loader2 aria-hidden className="size-5 animate-spin" />
            Проверяем код…
          </>
        ) : (
          submitLabel
        )}
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 font-semibold text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft aria-hidden className="size-4" />
          Другая почта
        </button>
        {left > 0 ? (
          <span className="text-muted-foreground tabular-nums">Новый код через {left} с</span>
        ) : (
          <button type="button" onClick={resend} className="font-semibold text-brand-ink transition-colors hover:text-brand-hover">
            Отправить код ещё раз
          </button>
        )}
      </div>
    </form>
  );
}
