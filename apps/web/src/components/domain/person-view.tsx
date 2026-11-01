import { ArrowUpRight, FileText } from "lucide-react";
import Link from "next/link";

import { SkillChip } from "@/components/domain/badges";
import { PersonPhoto } from "@/components/domain/person-card";
import type { PersonDetail } from "@/lib/api";
import { AVAILABILITY, COFOUND, LEVEL, LINK_KIND, TERMS, termsOf } from "@/lib/labels";

/**
 * Профиль человека как резюме: фото, имя, факты и условия в шапке, действия под ними.
 * Один и тот же вид у посетителя (/people/[slug]) и у владельца (/me/profile) — владелец видит
 * себя так же, как его видят основатели, только с кнопками редактирования вместо «Написать».
 */
export function PersonView({
  p,
  actions,
  signedIn,
  photoSlot,
  footer,
}: {
  p: PersonDetail;
  actions?: React.ReactNode;
  signedIn: boolean;
  /** Поверх фото: кнопка «Изменить фото» у владельца. */
  photoSlot?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const facts = [p.primary_role?.name ?? "Роль не указана", p.experience_level && LEVEL[p.experience_level].toLowerCase(), p.city, p.education].filter(Boolean);
  const terms = termsOf(p.looking_for);
  const experience = p.memberships ?? [];

  return (
    <>
      <header className="grid gap-6 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-start md:grid-cols-[240px_minmax(0,1fr)] md:gap-10">
        <div className="relative aspect-square w-full max-w-[160px] overflow-hidden rounded-[28px] bg-tone sm:max-w-none">
          <PersonPhoto person={p} eager sizes="240px" />
          {photoSlot}
        </div>
        <div className="min-w-0">
          {p.looking_for.includes(COFOUND) && (
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-ink">
              <span aria-hidden className="size-2 rounded-full bg-cornflower" />
              Ищет сообщников на свой стартап
            </span>
          )}
          <h1 className="text-[32px] leading-[1.04] sm:text-[48px]">{p.display_name}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{facts.join(", ")}</p>
          {p.headline && <p className="mt-4 max-w-[60ch] text-xl leading-snug font-bold tracking-[-0.02em]">{p.headline}</p>}
          {(terms.length > 0 || p.availability) && (
            <ul className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
              {terms.map((t) => (
                <li key={t} className="rounded-full bg-tone px-3 py-1.5">
                  {TERMS[t]}
                </li>
              ))}
              {p.availability && <li className="rounded-full bg-tone px-3 py-1.5">{AVAILABILITY[p.availability]}</li>}
            </ul>
          )}
          {actions && <div className="mt-6 flex flex-wrap items-center gap-2.5">{actions}</div>}
        </div>
      </header>

      <div className="mt-12 max-w-[880px]">
        {p.bio && (
          <section>
            <h2 className="text-[24px] sm:text-[28px]">О себе</h2>
            <p className="mt-3 text-lg leading-relaxed whitespace-pre-line text-foreground/85">{p.bio}</p>
          </section>
        )}

        <section className={p.bio ? "mt-10" : undefined}>
          <h2 className="text-[24px] sm:text-[28px]">Навыки</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {p.skills.length ? p.skills.map((s) => <SkillChip key={s.slug} name={s.name} />) : <span className="text-muted-foreground">Не указаны</span>}
          </div>
        </section>

        {experience.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[24px] sm:text-[28px]">Опыт на платформе</h2>
            <ol className="mt-4 grid gap-2">
              {experience.map((m) => (
                <li key={m.startup_slug + m.role_title} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-2xl bg-tone px-5 py-4">
                  <Link href={`/startups/${m.startup_slug}`} className="font-semibold hover:text-brand-ink">
                    {m.startup_title}
                  </Link>
                  <span className="text-muted-foreground">{m.role_title}</span>
                  <span className="ml-auto text-sm text-muted-foreground">с {sinceLabel(m.since)}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {(p.links.length > 0 || p.has_resume) && (
          <section className="mt-10">
            <h2 className="text-[24px] sm:text-[28px]">Работы</h2>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {p.has_resume && (
                <li>
                  {/* Резюме отдаём только вошедшим: гостю — ссылка на вход с возвратом сюда. */}
                  <a
                    href={signedIn ? `/api/people/${p.slug}/resume` : `/login?next=/people/${p.slug}`}
                    target={signedIn ? "_blank" : undefined}
                    rel={signedIn ? "noopener" : undefined}
                    className="group flex h-full items-center gap-3 rounded-2xl bg-tone p-4 transition-colors hover:bg-tone-2"
                  >
                    <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand-ink">
                      <FileText className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-muted-foreground">{signedIn ? "PDF" : "Откроется после входа"}</span>
                      <span className="mt-0.5 block truncate font-semibold">Резюме</span>
                    </span>
                    <ArrowUpRight aria-hidden className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </a>
                </li>
              )}
              {p.links.map((l) => (
                <li key={l.url}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="group flex h-full items-center gap-3 rounded-2xl bg-tone p-4 transition-colors hover:bg-tone-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-muted-foreground">{LINK_KIND[l.kind]}</span>
                      <span className="mt-0.5 block truncate font-semibold">{linkLabel(l.url)}</span>
                    </span>
                    <ArrowUpRight aria-hidden className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {footer && <div className="mt-12 border-t pt-5 text-sm">{footer}</div>}
      </div>
    </>
  );
}

/** «с октября 2026»: в формате месяца с днём Intl даёт родительный падеж. */
function sinceLabel(iso: string) {
  const d = new Date(iso);
  const m = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(d).replace(/^\d+\s/, "");
  return `${m} ${d.getFullYear()}`;
}

/** «github.com/kirill» вместо голого домена и «/»; у ссылки без пути — только домен. */
function linkLabel(url: string) {
  const path = url.replace(/^https?:\/\/[^/]+/, "").replace(/\/$/, "");
  return domainOf(url) + path;
}

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
