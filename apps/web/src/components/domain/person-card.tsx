import Link from "next/link";

import type { PersonCard as PersonCardData } from "@/lib/api";
import { TermsBadge } from "@/components/domain/badges";
import { AVAILABILITY, COFOUND, LEVEL, initials, termsOf } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** Крупное фото человека или инициалы на мягком фоне, если фото нет. */
export function PersonPhoto({
  person,
  className,
  eager,
  sizes = "(min-width: 640px) 290px, 104px",
}: {
  person: PersonCardData;
  className?: string;
  eager?: boolean;
  sizes?: string;
}) {
  const url = person.avatar_url_lg ?? person.avatar_url;
  if (url)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- аватары уже пережаты api в WebP 512 px
      <img
        src={url}
        srcSet={url.endsWith("-1024.webp") ? `${url.replace("-1024.webp", "-512.webp")} 512w, ${url} 1024w` : undefined}
        sizes={sizes}
        alt=""
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={cn("size-full bg-tone-2 object-cover", className)}
      />
    );
  return (
    <span
      aria-hidden
      className={cn("grid size-full place-items-center bg-[radial-gradient(120%_100%_at_50%_0%,var(--brand-soft),var(--marker))]", className)}
    >
      <span className="text-[36px] sm:text-[48px] lg:text-[64px] font-extrabold tracking-[-0.04em] text-brand-ink">{initials(person.display_name)}</span>
    </span>
  );
}

/**
 * Карточка человека — одна на весь сайт: каталог, главная, «Сообщники», кабинет.
 * Устроена как резюме на hh: во всю строку, фото, роль заголовком, имя и город, бейджи условий.
 * Ниже строки «подпись — значение»; значения стоят по одной линии с заголовком.
 */
export function PersonCard({
  person,
  as: Tag = "div",
  eager,
  surface = "tone",
  href,
}: {
  person: PersonCardData;
  as?: "div" | "li";
  eager?: boolean;
  /** Куда вести вместо профиля (витрина главной: таких людей в базе нет). */
  href?: string;
  /** На цветной подложке карточка белая, чипы внутри — серые. */
  surface?: "tone" | "white";
}) {
  const white = surface === "white";
  const chip = white ? "bg-tone" : "bg-white";
  const cofound = person.looking_for.includes(COFOUND);
  const terms = termsOf(person.looking_for);
  const level = person.experience_level ? LEVEL[person.experience_level] : null;
  const availability = person.availability ? AVAILABILITY[person.availability] : null;
  const skills = person.skills.slice(0, 6);
  const more = person.skills.length - skills.length;
  const photo = person.avatar_url ?? person.avatar_url_lg;
  const title = person.primary_role?.name ?? person.display_name;
  // Прочерк или точка вместо текста — то же, что пустое поле: строку не рисуем.
  const headline = filled(person.headline);
  const city = filled(person.city);
  const rows: [string, React.ReactNode][] = [];
  if (level) rows.push(["Опыт", level]);
  if (headline) rows.push(["О себе", <span key="h" className="line-clamp-2">{headline}</span>]);
  if (skills.length)
    rows.push([
      "Навыки",
      <span key="s" className="flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <span key={s.slug} className={cn("rounded-full px-2.5 py-0.5 text-sm font-semibold", chip)}>
            {s.name}
          </span>
        ))}
        {more > 0 && <span className={cn("rounded-full px-2.5 py-0.5 text-sm font-semibold text-muted-foreground", chip)}>+{more}</span>}
      </span>,
    ]);
  const cols = "grid grid-cols-[64px_minmax(0,1fr)] gap-x-4 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-x-6";

  return (
    <Tag>
      <Link
        href={href ?? `/people/${person.slug}`}
        className={cn("card-hover group block rounded-3xl p-5 sm:p-7", white ? "bg-white hover:bg-tone" : "bg-tone hover:bg-tone-2")}
      >
        <div className={cols}>
          <span className="relative size-16 overflow-hidden rounded-2xl bg-tone-2 sm:size-24">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- аватары уже пережаты api в WebP
              <img src={photo} alt="" loading={eager ? "eager" : "lazy"} decoding="async" className="size-full object-cover" />
            ) : (
              <span aria-hidden className="grid size-full place-items-center bg-brand-soft text-xl font-extrabold text-brand-ink sm:text-3xl">
                {initials(person.display_name)}
              </span>
            )}
          </span>
          <div className="min-w-0 self-center">
            <div className="flex items-start gap-3">
              <h3 className="min-w-0 truncate text-xl leading-7 font-bold tracking-[-0.02em] text-brand-ink transition-colors group-hover:text-brand-hover sm:text-2xl sm:leading-8">
                {title}
              </h3>
              {person.is_demo && (
                <span title="Пример: так выглядит карточка на Envola" className="ml-auto shrink-0 pt-1 text-xs font-semibold text-muted-foreground max-sm:hidden">
                  Пример
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-base">
              {person.primary_role && <span className="font-semibold">{person.display_name}</span>}
              {city && <span className="text-muted-foreground">{person.primary_role ? " · " : ""}{city}</span>}
            </p>
            {(cofound || terms.length > 0 || availability) && (
              <span className="mt-3 flex flex-wrap gap-1.5 max-sm:hidden">
                <Badges cofound={cofound} terms={terms} availability={availability} chip={chip} />
              </span>
            )}
          </div>
        </div>
        {/* На телефоне бейджи под фото во всю ширину: рядом с ним им тесно. */}
        {(cofound || terms.length > 0 || availability) && (
          <span className="mt-4 flex flex-wrap gap-1.5 sm:hidden">
            <Badges cofound={cofound} terms={terms} availability={availability} chip={chip} />
          </span>
        )}
        {rows.length > 0 && (
          <dl className="mt-5 border-t border-foreground/[0.08] sm:mt-6">
            {rows.map(([label, value]) => (
              <div key={label} className={cn(cols, "items-baseline border-b border-foreground/[0.08] py-3 last:border-b-0 last:pb-0")}>
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="min-w-0 text-base">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Link>
    </Tag>
  );
}

function filled(value: string) {
  const v = value.trim();
  return /^[-–—.\s]*$/.test(v) ? "" : v;
}

function Badges({ cofound, terms, availability, chip }: { cofound: boolean; terms: string[]; availability: string | null; chip: string }) {
  return (
    <>
      {cofound && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-ink">
          <span aria-hidden className="size-1.5 rounded-full bg-brand" />
          Ищет сообщников
        </span>
      )}
      {terms.map((t) => (
        <TermsBadge key={t} terms={t} />
      ))}
      {availability && <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", chip)}>{availability}</span>}
    </>
  );
}
