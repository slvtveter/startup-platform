// Русские подписи для значений перечислений из API.

// Условия оплаты: подпись сама говорит, что речь о деньгах («Обсуждается» читалось как «идею обсуждают»).
export const TERMS: Record<string, string> = {
  free: "Без оплаты",
  paid: "Оплачивается",
  negotiable: "Оплата обсуждается",
};

export const TERMS_HINT: Record<string, string> = {
  free: "Опыт и проект в портфолио, без оплаты",
  paid: "Оплата в месяц или за весь проект",
  negotiable: "Формат и оплату договоритесь на созвоне",
};

/** «Ищу сообщников»: хочу придумать и запустить стартап с нуля вместе с другими. Хранится в looking_for. */
export const COFOUND = "cofound";

/** Условия участия человека без отметки «сообщники» — для строки «Условия». */
export function termsOf(lookingFor: string[]) {
  return lookingFor.filter((t) => t in TERMS);
}

export const STAGE: Record<string, string> = {
  idea: "Идея",
  prototype: "Прототип",
  mvp: "MVP",
  launched: "Запущен",
};

export const LEVEL: Record<string, string> = {
  no_experience: "Без опыта",
  courses: "После курсов",
  internship: "После стажировки",
  junior: "Junior",
};

export const AVAILABILITY: Record<string, string> = {
  few_hours: "Пара часов в неделю",
  part_time: "Частичная занятость",
  full_time: "Полная занятость",
};

export const STARTUP_STATUS: Record<string, string> = {
  draft: "Черновик",
  recruiting: "Идёт набор",
  closed: "Набор закрыт",
  archived: "В архиве",
};

export const APP_STATUS: Record<string, string> = {
  pending: "На рассмотрении",
  accepted: "Принят",
  rejected: "Отклонён",
  withdrawn: "Отозван",
};

export const LINK_KIND: Record<string, string> = {
  portfolio: "Портфолио",
  github: "GitHub",
  behance: "Behance",
  linkedin: "LinkedIn",
  other: "Ссылка",
};

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return "только что";
  const h = Math.floor(diff / 3600);
  if (h < 24) return `${h} ${plural(h, "час", "часа", "часов")} назад`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ${plural(d, "день", "дня", "дней")} назад`;
  if (d < 30) {
    const w = Math.floor(d / 7);
    return w === 1 ? "неделю назад" : `${w} ${plural(w, "неделю", "недели", "недель")} назад`;
  }
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

/** Как в API (schemas/startup.py, MAX_SLOTS): не больше трёх человек на одну роль. */
export const MAX_SLOTS = 3;
