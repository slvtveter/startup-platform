import Link from "next/link";

import type { PersonCard as PersonCardData } from "@/lib/api";
import { AVAILABILITY, COFOUND, LEVEL, TERMS, initials, termsOf } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function PersonAvatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const cls = size === "lg" ? "size-20 text-2xl" : "size-12 text-base";
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-brand-soft font-extrabold text-brand-ink ${cls}`}>
      {initials(name)}
    </span>
  );
}

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
 * Устроена как резюме: небольшое фото, роль заголовком, имя и город, ниже строки «подпись — значение».
 */
export function PersonCard({
  person,
  as: Tag = "div",
  eager,
  surface = "tone",
}: {
  person: PersonCardData;
  as?: "div" | "li";
  eager?: boolean;
  /** На цветной подложке карточка белая, чипы внутри — серые. */
  surface?: "tone" | "white";
}) {
  const white = surface === "white";
  const chip = white ? "bg-tone" : "bg-white";
  const cofound = person.looking_for.includes(COFOUND);
  const terms = termsOf(person.looking_for).map((t, i) => (i ? TERMS[t].toLowerCase() : TERMS[t]));
  const level = person.experience_level ? LEVEL[person.experience_level] : null;
  const availability = person.availability ? AVAILABILITY[person.availability] : null;
  const experience = level ? [level, availability?.toLowerCase()].filter(Boolean).join(", ") : (availability ?? "");
  const skills = person.skills.slice(0, 3);
  const more = person.skills.length - skills.length;
  const photo = person.avatar_url ?? person.avatar_url_lg;
  const title = person.primary_role?.name ?? person.display_name;
  const sub = [person.primary_role ? person.display_name : null, person.city].filter(Boolean).join(" · ");
  const rows: [string, React.ReactNode][] = [];
  if (experience) rows.push(["Опыт", experience]);
  if (skills.length)
    rows.push([
      "Навыки",
      <span key="s" className="flex flex-wrap gap-1">
        {skills.map((s) => (
          <span key={s.slug} className={cn("rounded-md px-2 py-0.5 text-xs leading-5 font-semibold", chip)}>
            {s.name}
          </span>
        ))}
        {more > 0 && <span className={cn("rounded-md px-2 py-0.5 text-xs leading-5 font-semibold text-muted-foreground", chip)}>+{more}</span>}
      </span>,
    ]);
  if (person.headline) rows.push(["О себе", <span key="h" className="line-clamp-2">{person.headline}</span>]);
  if (terms.length) rows.push(["Условия", terms.join(", ")]);

  return (
    <Tag className="h-full">
      <Link
        href={`/people/${person.slug}`}
        className={cn(
          "card-hover group flex h-full flex-col rounded-3xl p-5 sm:p-6",
          white ? "bg-white hover:bg-tone" : "bg-tone hover:bg-tone-2",
        )}
      >
        <div className="flex items-start gap-4">
          <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-tone-2 sm:size-20">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- аватары уже пережаты api в WebP
              <img src={photo} alt="" loading={eager ? "eager" : "lazy"} decoding="async" className="size-full object-cover" />
            ) : (
              <span aria-hidden className="grid size-full place-items-center bg-brand-soft text-xl font-extrabold text-brand-ink">
                {initials(person.display_name)}
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg leading-6 font-bold tracking-[-0.01em] text-brand-ink group-hover:text-brand-hover sm:text-xl sm:leading-7">
              {title}
            </h3>
            {sub && <p className="mt-0.5 truncate text-sm text-foreground/80">{sub}</p>}
            {(cofound || person.is_demo) && (
              <span className="mt-2 flex flex-wrap gap-1.5">
                {cofound && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-soft px-2 py-0.5 text-xs leading-5 font-semibold text-brand-ink">
                    <span aria-hidden className="size-1.5 rounded-full bg-brand" />
                    Ищет сообщников
                  </span>
                )}
                {person.is_demo && (
                  <span title="Пример: так выглядит карточка на Envola" className={cn("rounded-md px-2 py-0.5 text-xs leading-5 font-semibold text-muted-foreground", chip)}>
                    Пример
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
        {rows.length > 0 && (
          <dl className="mt-4 grid grid-cols-[76px_1fr] text-sm sm:grid-cols-[96px_1fr]">
            {rows.map(([label, value], i) => (
              <div key={label} className={cn("col-span-2 grid grid-cols-subgrid gap-x-3 py-2.5", i > 0 && "border-t border-foreground/[0.08]")}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="min-w-0">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Link>
    </Tag>
  );
}
