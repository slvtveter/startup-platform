import Link from "next/link";

import { FieldError } from "@/components/auth/auth-card";

export type TermsState = { terms: boolean; adult: boolean };

const link = "font-semibold text-brand-ink underline underline-offset-2 hover:text-brand-hover";

/**
 * Две отдельные пустые галочки (соглашение и 18+) и рядом ссылка на политику.
 * Политика — не согласие, а уведомление: галочки для неё нет. Тексты — по инструкции юриста.
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
  const box = "mt-0.5 size-4 shrink-0 accent-[var(--brand)]";
  return (
    <div className="grid gap-3 text-sm text-muted-foreground">
      <div>
        <label className="flex gap-3">
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
            Я ознакомился(-лась) с{" "}
            <Link href="/terms" target="_blank" className={link}>
              Пользовательским соглашением
            </Link>{" "}
            и принимаю его условия
          </span>
        </label>
        <FieldError id="terms-error" message={errors.terms} />
      </div>
      <div>
        <label className="flex gap-3">
          <input
            id="adult"
            type="checkbox"
            aria-invalid={!!errors.adult}
            aria-describedby={errors.adult ? "adult-error" : undefined}
            checked={value.adult}
            onChange={(e) => onChange({ ...value, adult: e.target.checked })}
            className={box}
          />
          Подтверждаю, что мне исполнилось 18 лет
        </label>
        <FieldError id="adult-error" message={errors.adult} />
      </div>
      <p>
        Как мы обрабатываем персональные данные:{" "}
        <Link href="/privacy" target="_blank" className={link}>
          Политика конфиденциальности
        </Link>
      </p>
    </div>
  );
}

export function termsErrors(v: TermsState): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!v.terms) errs.terms = "Без согласия с соглашением аккаунт не создать";
  if (!v.adult) errs.adult = "Envola только для тех, кому есть 18";
  return errs;
}
