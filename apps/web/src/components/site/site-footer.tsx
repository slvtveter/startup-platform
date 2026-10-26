import Link from "next/link";

import { FeedbackButton } from "@/components/site/feedback-button";
import { LogoMark } from "@/components/site/logo";

// Подвал не повторяет шапку: здесь короткие подсказки по сценариям для двух аудиторий.
const COLUMNS = [
  {
    title: "Ищешь первый опыт",
    links: [
      { href: "/me/profile", label: "Заполнить профиль" },
      { href: "/startups?terms=free", label: "Проекты без оплаты для портфолио" },
      { href: "/startups?stage=mvp&stage=launched", label: "Проекты с живым продуктом" },
      { href: "/me/settings", label: "Подборка ролей на почту" },
    ],
  },
  {
    title: "Собираешь команду",
    links: [
      { href: "/startups/new", label: "Разместить стартап" },
      { href: "/people?level=internship", label: "Люди после стажировки" },
      { href: "/people?looking_for=negotiable", label: "Открыты к обсуждению условий" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-secondary/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 text-sm sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 font-heading text-[15px] font-semibold">
            <LogoMark />
            envola
          </div>
          <p className="mt-3 max-w-xs text-muted-foreground">
            Новички в IT получают первый реальный опыт, а основатели — людей в команду. Без резюме и откликов в пустоту.
          </p>
          <div className="mt-4 text-muted-foreground">
            <FeedbackButton />
          </div>
        </div>
        {COLUMNS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="font-sans text-sm font-semibold tracking-normal">{c.title}</h2>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:px-6">
          <span>© {new Date().getFullYear()} envola</span>
          <Link href="/cookies" className="hover:text-foreground">
            Cookie и данные
          </Link>
        </div>
      </div>
    </footer>
  );
}
