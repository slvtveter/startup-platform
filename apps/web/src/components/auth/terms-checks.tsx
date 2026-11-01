import Link from "next/link";

import { FieldError } from "@/components/auth/auth-card";
import { cn } from "@/lib/utils";

export type TermsState = { terms: boolean; publish: boolean };

const link = "font-semibold text-brand-ink underline underline-offset-2 hover:text-brand-hover";

/**
 * Две пустые галочки.
 * 1. Обязательная: 18+ и соглашение одной строкой (возраст — условие из п. 2.1 соглашения).
 *    Политика конфиденциальности — уведомление, а не согласие: только ссылка в той же строке.
 * 2. Необязательная: согласие на публикацию профиля (ст. 10.1 152-ФЗ требует оформлять его
 *    отдельно от других согласий). Дано здесь — при публикации профиля больше ничего не спросим.
 */
export function TermsChecks({
  value,
  onChange,
  errors,
}: {
  value: TermsState;
  onChange: (v: TermsState) => void;
  errors: Record<string, string>;
}) {
  const box = "size-6 shrink-0 accent-[var(--brand)]";
  // Строка 24px — у ссылок внутри текста тап-зона не меньше 24px (WCAG 2.5.8).
  const a = cn(link, "inline py-0.5");
  return (
    <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
      <div>
        <label className="flex items-start gap-3">
          <input
            id="terms"
            type="checkbox"
            aria-invalid={!!errors.terms}
            aria-describedby={errors.terms ? "terms-error" : undefined}
            checked={value.terms}
            onChange={(e) => onChange({ ...value, terms: e.target.checked })}
            className={box}
          />
          <span>
            Мне есть 18 лет, я принимаю{" "}
            <Link href="/terms" target="_blank" className={a}>
              Пользовательское соглашение
            </Link>{" "}
            и ознакомлен(а) с{" "}
            <Link href="/privacy" target="_blank" className={a}>
              Политикой конфиденциальности
            </Link>
          </span>
        </label>
        <FieldError id="terms-error" message={errors.terms} />
      </div>
      <label className="flex items-start gap-3">
        <input
          id="publish"
          type="checkbox"
          checked={value.publish}
          onChange={(e) => onChange({ ...value, publish: e.target.checked })}
          className={box}
        />
        <span>
          Согласен(на) на{" "}
          <Link href="/profile/publication-consent" target="_blank" className={a}>
            публикацию профиля
          </Link>{" "}
          в каталоге людей
        </span>
      </label>
    </div>
  );
}

export function termsErrors(v: TermsState): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!v.terms) errs.terms = "Без согласия с соглашением аккаунт не создать";
  return errs;
}
