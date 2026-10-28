import Link from "next/link";

import { ArrowRight } from "lucide-react";
import type { PersonCard as PersonCardData } from "@/lib/api";
import { COFOUND, LEVEL, TERMS, initials, termsOf } from "@/lib/labels";
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
export function PersonPhoto({ person, className, eager }: { person: PersonCardData; className?: string; eager?: boolean }) {
  const url = person.avatar_url_lg ?? person.avatar_url;
  if (url)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- аватары уже пережаты api в WebP 512 px
      <img
        src={url}
        srcSet={url.endsWith("-1024.webp") ? `${url.replace("-1024.webp", "-512.webp")} 512w, ${url} 1024w` : undefined}
        sizes="(min-width: 640px) 340px, 104px"
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
      <span className="text-[clamp(40px,5vw,64px)] font-extrabold tracking-[-0.04em] text-brand-ink">{initials(person.display_name)}</span>
    </span>
  );
}

/**
 * Карточка человека — одна на весь сайт: каталог, главная, «Сообщники».
 * Фото, имя, роль и опыт, о себе в двух строках, навыки, город и условия.
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
  const role = [person.primary_role?.name, person.experience_level ? LEVEL[person.experience_level]?.toLowerCase() : null]
    .filter(Boolean)
    .join(", ");
  const cofound = person.looking_for.includes(COFOUND);
  const terms = termsOf(person.looking_for).map((t) => TERMS[t].toLowerCase());
  // Навыки строго в одну строку: два первых (длинные обрезаются), остальное — «+N».
  const skills = person.skills.slice(0, 2);
  const more = person.skills.length - skills.length;
  const place = person.city || (terms.length ? terms.join(", ") : "");
  return (
    <Tag className="h-full">
      <Link
        href={`/people/${person.slug}`}
        className={cn(
          "card-hover group flex h-full rounded-[28px] p-2 max-sm:gap-1 sm:flex-col",
          white ? "bg-white hover:bg-tone" : "bg-tone hover:bg-tone-2",
        )}
      >
        <span className="relative block aspect-square shrink-0 self-start overflow-hidden rounded-[20px] bg-tone-2 max-sm:w-[104px] sm:self-stretch">
          <PersonPhoto person={person} eager={eager} />
          {cofound && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-foreground shadow-sm max-sm:hidden">
              <span aria-hidden className="size-2 rounded-full bg-cornflower" />
              Ищет сообщников
            </span>
          )}
        </span>
        {/* Каждый текстовый блок фиксированной высоты: имя и роль — по строке, о себе — две строки, навыки — одна. */}
        <div className="flex min-w-0 flex-1 flex-col px-3 pt-4 pb-3 max-sm:pt-2 max-sm:pb-2">
          {cofound && (
            <span className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold text-brand-ink sm:hidden">
              <span aria-hidden className="size-1.5 rounded-full bg-cornflower" />
              Ищет сообщников
            </span>
          )}
          <h3 className="truncate text-lg leading-6 font-extrabold tracking-[-0.02em]">{person.display_name}</h3>
          <p className="truncate text-sm leading-5 text-muted-foreground">{role || "\u00A0"}</p>
          <p className="mt-2.5 line-clamp-2 min-h-10 text-sm leading-5 max-sm:mt-1.5">{person.headline || "\u00A0"}</p>
          <span className="mt-3 flex h-6 min-w-0 items-center gap-1 overflow-hidden max-sm:mt-2" aria-label="Навыки">
            {skills.map((s, i) => (
              <span key={s.slug} className={cn("truncate rounded-full px-2.5 py-0.5 text-xs leading-5 font-semibold", chip, i === 0 ? "max-w-[65%] shrink-0" : "min-w-12 max-sm:hidden")} title={s.name}>
                {s.name}
              </span>
            ))}
            {/* На телефоне карточка узкая: один навык и «+N», на широком — два. */}
            {more > 0 && <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs leading-5 font-semibold text-muted-foreground max-sm:hidden", chip)}>+{more}</span>}
            {skills.length > 1 && (
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs leading-5 font-semibold text-muted-foreground sm:hidden", chip)}>+{person.skills.length - 1}</span>
            )}
          </span>
          <span className="mt-auto pt-4 max-sm:pt-2.5">
            <span className="flex items-center gap-2 border-t border-foreground/[0.08] pt-3 text-[13px] text-muted-foreground max-sm:pt-2">
              <span className="min-w-0 truncate">{place}</span>
              <span className="ml-auto inline-flex shrink-0 items-center gap-1 font-bold text-brand-ink">
                Профиль
                <ArrowRight aria-hidden className="size-3.5" />
              </span>
            </span>
          </span>
        </div>
      </Link>
    </Tag>
  );
}
