// «Следующий шаг» на главной вошедшего пользователя (KAN-84): одно главное действие вместо набора разделов.
// Без импортов из "@/…": функция проверяется тестом Playwright напрямую.

export type NextStepInput = {
  emailVerified: boolean;
  applyBlockers: string[];
  /** Входящие отклики в моих стартапах: [slug, сколько ждут ответа]. */
  pendingIncoming: { slug: string; title: string; count: number }[];
  /** Мои отклики и приглашения. */
  applications: { status: string; startupTitle: string; decidedAt: string | null }[];
  hasStartups: boolean;
  now?: Date;
};

export type NextStep = {
  kind: "answer" | "accepted" | "verify" | "profile" | "apply" | "wait";
  title: string;
  text: string;
  href: string;
  cta: string;
};

const WEEK = 7 * 24 * 3600 * 1000;

export function nextStep(i: NextStepInput): NextStep {
  const now = i.now ?? new Date();
  const incoming = i.pendingIncoming.filter((s) => s.count > 0).sort((a, b) => b.count - a.count);
  if (incoming.length) {
    const total = incoming.reduce((n, s) => n + s.count, 0);
    return {
      kind: "answer",
      title: `Ответь на ${total} ${plural(total, "отклик", "отклика", "откликов")}`,
      text: "Люди ждут решения. Быстрый ответ повышает доверие к твоей команде, а скорость ответа видна на странице стартапа.",
      href: `/me/startups/${incoming[0].slug}`,
      cta: "Открыть отклики",
    };
  }
  const accepted = i.applications.find(
    (a) => a.status === "accepted" && a.decidedAt && now.getTime() - new Date(a.decidedAt).getTime() < WEEK,
  );
  if (accepted) {
    return {
      kind: "accepted",
      title: `Тебя приняли в ${accepted.startupTitle}`,
      text: "Контакты уже открыты. Напиши основателю первым и договорись о короткой встрече в течение пары дней.",
      href: "/me/applications",
      cta: "Посмотреть контакты",
    };
  }
  if (!i.emailVerified) {
    return {
      kind: "verify",
      title: "Подтверди почту",
      text: "Мы отправили письмо со ссылкой. Без подтверждения нельзя откликаться и публиковать стартап.",
      href: "/me/settings",
      cta: "Отправить письмо ещё раз",
    };
  }
  if (!i.hasStartups && i.applyBlockers.length) {
    return {
      kind: "profile",
      title: "Добавь пару полей в профиль",
      text: `Чтобы откликаться: ${i.applyBlockers.map((b) => b.toLowerCase()).join(", ")}.`,
      href: "/me/profile",
      cta: "Заполнить профиль",
    };
  }
  const pending = i.applications.filter((a) => a.status === "pending").length;
  const inTeam = i.applications.some((a) => a.status === "accepted");
  if (!pending && !i.hasStartups && !inTeam) {
    return {
      kind: "apply",
      title: "Выбери первое место в команде",
      text: "Ниже стартапы, которые подходят под твою роль и навыки. Отклик занимает пару минут.",
      href: "/startups",
      cta: "Все свободные места",
    };
  }
  return {
    kind: "wait",
    title: pending
      ? `${pending} ${plural(pending, "отклик ждёт", "отклика ждут", "откликов ждут")} ответа`
      : "Всё сделано",
    text: pending
      ? "Основатели обычно отвечают за 2–3 дня. Пока ждёшь, можно откликнуться ещё на одно место."
      : "Новые отклики и решения придут на почту.",
    href: pending ? "/me/applications" : "/startups",
    cta: pending ? "Мои отклики" : "Смотреть стартапы",
  };
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
