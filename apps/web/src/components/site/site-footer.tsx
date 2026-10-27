import Link from "next/link";

import { FeedbackButton } from "@/components/site/feedback-button";
import { Wordmark } from "@/components/site/logo";

// Подвал не повторяет шапку: короткие подсказки по трём сценариям — есть идея, нужны люди, хочу в команду.
const COLUMNS = [
  {
    title: "Есть идея",
    links: [
      { href: "/startups/new", label: "Опубликовать идею" },
      { href: "/startups?stage=idea", label: "Идеи других" },
      { href: "/startups?stage=idea&terms=free", label: "Идеи без оплаты, на равных" },
    ],
  },
  {
    title: "Нет идеи",
    links: [
      { href: "/cofounders", label: "Найти сообщников" },
      { href: "/people?cofound=1", label: "Кто хочет придумать стартап" },
      { href: "/me/profile", label: "Отметить «Ищу сообщников»" },
    ],
  },
  {
    title: "Нужны люди",
    links: [
      { href: "/people", label: "Все люди" },
      { href: "/people?level=internship", label: "После стажировки" },
      { href: "/chats", label: "Сообщения" },
    ],
  },
  {
    title: "Хочу в команду",
    links: [
      { href: "/me/profile", label: "Заполнить профиль" },
      { href: "/startups?terms=free", label: "Проекты для портфолио" },
      { href: "/startups?stage=mvp&stage=launched", label: "Проекты с живым продуктом" },
      { href: "/me/settings", label: "Подборка ролей на почту" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-24 w-full max-w-[1360px] px-4 pb-4 sm:px-6 lg:px-10">
      <div className="rounded-[28px] bg-tone px-5 sm:px-8 lg:px-10">
        <div className="grid gap-10 py-12 text-[15px] sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-xs text-muted-foreground">
              Место, где из разговора вырастает стартап: обсуждай идеи, находи сообщников, вступай в команды.
            </p>
            <div className="mt-4 text-muted-foreground">
              <FeedbackButton />
            </div>
          </div>
          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2 className="text-[15px] font-bold tracking-normal">{c.title}</h2>
              <ul className="mt-3 space-y-2.5 text-muted-foreground">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-t py-5 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} envola</span>
          <Link href="/cookies" className="transition-colors hover:text-foreground">
            Cookie и данные
          </Link>
        </div>
      </div>
    </footer>
  );
}
