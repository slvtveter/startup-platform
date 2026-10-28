import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { FeedbackButton } from "@/components/site/feedback-button";
import { Wordmark } from "@/components/site/logo";

// Подвал не повторяет шапку: короткие подсказки по трём сценариям — есть идея, нужны люди, хочу в команду.
const COLUMNS = [
  {
    title: "Есть идея",
    links: [
      { href: "/startups/new", label: "Опубликовать идею" },
      { href: "/ideas", label: "Идеи других" },
      { href: "/ideas?terms=free", label: "Идеи без оплаты, на равных" },
    ],
  },
  {
    title: "Нет идеи",
    links: [
      { href: "/people/cofounders", label: "Найти сообщников" },
      { href: "/ideas", label: "Идеи, к которым можно подключиться" },
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
        <div className="grid gap-6 py-10 text-base sm:grid-cols-2 sm:gap-10 sm:py-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
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
            <nav key={c.title} aria-label={c.title} className="max-sm:hidden">
              <h2 className="text-base font-bold tracking-normal">{c.title}</h2>
              <ul className="mt-3 space-y-2.5 text-muted-foreground">
                {c.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          {/* На телефоне колонки свёрнуты: подвал не занимает полтора экрана. */}
          <div className="divide-y divide-foreground/10 border-y border-foreground/10 sm:hidden">
            {COLUMNS.map((c) => (
              <details key={c.title} className="group py-3">
                <summary className="flex list-none items-center justify-between text-base font-bold [&::-webkit-details-marker]:hidden">
                  {c.title}
                  <ChevronDown aria-hidden className="size-4 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <ul className="mt-3 space-y-2.5 text-muted-foreground">
                  {c.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="transition-colors hover:text-foreground">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
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
