import Link from "next/link";

import { FeedbackButton } from "@/components/site/feedback-button";
import { Wordmark } from "@/components/site/logo";

// Подвал как у hh и Peerlist: ссылки на посадочные страницы ролей. Человеку — быстрый вход
// в нужный срез каталога, поисковику — перелинковка страниц «Стартапы ищут дизайнера», «Дизайнеры».
// Роли — самые частые из справочника; переименование в админке ссылки не ломает (slug не меняется).
const ROLES = [
  ["frontend", "Frontend-разработчик"],
  ["backend", "Backend-разработчик"],
  ["mobile", "Mobile-разработчик"],
  ["designer", "Дизайнер"],
  ["product", "Продакт-менеджер"],
  ["marketer", "Маркетолог"],
  ["analyst", "Аналитик данных"],
] as const;

// Продакт-менеджера стартапы ищут реже всего (на 31.10.2026 — ни одного проекта): в колонке проектов его нет.
const STARTUP_ROLES = ROLES.filter(([slug]) => slug !== "product");

// Четыре ровные колонки во всю ширину (решение владельца 2026-11-01): без пустоты посередине
// и без строк ссылок через точку. «Стартапы ищут» — посадочные страницы ролей для SEO.
const COLUMNS = [
  {
    title: "Платформа",
    links: [
      { href: "/startups", label: "Стартапы" },
      { href: "/startups?stage=idea", label: "Идеи" },
      { href: "/people", label: "Люди" },
      { href: "/people/cofounders", label: "Сообщники" },
    ],
  },
  // Три самые частые роли и ссылка на всё — колонка не длиннее соседних.
  {
    title: "Стартапы ищут",
    links: [
      ...STARTUP_ROLES.slice(0, 3).map(([slug, name]) => ({ href: `/startups?role=${slug}`, label: name })),
      { href: "/startups", label: "Все вакансии →" },
    ],
  },
  {
    title: "Envola",
    links: [
      { href: "/startups/new", label: "Добавить проект" },
      { href: "/guides", label: "Гайды" },
    ],
  },
];

const LEGAL = [
  { href: "/terms", label: "Пользовательское соглашение" },
  { href: "/privacy", label: "Политика конфиденциальности" },
  { href: "/cookies", label: "Cookie" },
];

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-24 w-full max-w-[1360px] px-4 pb-4 sm:px-6 lg:px-10">
      <div className="rounded-[28px] bg-tone px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 sm:py-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-x-10">
          <div className="col-span-2 lg:col-span-1">
            <Wordmark />
            <p className="mt-3 max-w-xs text-muted-foreground">Стартапы и команды для студентов и начинающих в IT.</p>
          </div>
          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title} className={c.title === "Стартапы ищут" ? "max-sm:col-span-2 max-sm:row-start-3" : undefined}>
              <h2 className="text-sm font-bold tracking-normal">{c.title}</h2>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
                {c.title === "Envola" && (
                  <li className="text-muted-foreground">
                    <FeedbackButton />
                  </li>
                )}
              </ul>
            </nav>
          ))}
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-t py-5 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} envola</span>
          <nav aria-label="Документы" className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL.map((l) => (
              <Link key={l.href} href={l.href} className="inline-flex min-h-6 items-center transition-colors hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
