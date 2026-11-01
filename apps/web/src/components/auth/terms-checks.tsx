import Link from "next/link";

export type TermsState = { publish: boolean };

const link = "font-semibold text-brand-ink underline underline-offset-2 hover:text-brand-hover";

/**
 * Регистрация с одной галочкой (решение владельца 2026-11-01, разбор в docs/legal.md):
 * - Соглашение и 18+ (п. 2.1 соглашения) принимаются нажатием кнопки — акцепт действием
 *   (п. 3 ст. 438 ГК). Данные аккаунта обрабатываются по договору (п. 5 ч. 1 ст. 6 152-ФЗ),
 *   поэтому отдельного согласия на обработку нет, а политика — уведомление и только ссылка.
 * - Согласие на публикацию профиля (ст. 10.1) по закону отдельное и активное: пустая
 *   необязательная галочка. Отмечена — при публикации профиля больше ничего не спросим.
 */
export function PublishCheck({ value, onChange }: { value: TermsState; onChange: (v: TermsState) => void }) {
  return (
    <label className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
      <input
        id="publish"
        type="checkbox"
        checked={value.publish}
        onChange={(e) => onChange({ ...value, publish: e.target.checked })}
        className="size-6 shrink-0 accent-[var(--brand)]"
      />
      <span>
        Согласен(на) на{" "}
        <Link href="/profile/publication-consent" target="_blank" className={`${link} inline py-0.5`}>
          публикацию профиля
        </Link>{" "}
        в каталоге людей
      </span>
    </label>
  );
}

/** Строка под кнопкой: нажатие кнопки = принятие соглашения и подтверждение 18+. */
export function TermsNote({ action }: { action: string }) {
  return (
    <p className="text-center text-xs leading-5 text-muted-foreground">
      Нажимая «{action}», ты подтверждаешь, что тебе есть 18 лет, и принимаешь{" "}
      <Link href="/terms" target="_blank" className={`${link} inline py-0.5`}>
        Пользовательское соглашение
      </Link>
      .{" "}
      <Link href="/privacy" target="_blank" className={`${link} inline py-0.5`}>
        Политика конфиденциальности
      </Link>
    </p>
  );
}
