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
  const skills = person.skills.slice(0, 3);
  const more = person.skills.length - skills.length;
  return (
    <Tag className="h-full">
      <Link href={`/people/${person.slug}`} className={cn("card-hover group flex h-full rounded-[28px] p-2 max-sm:items-start max-sm:gap-1 sm:flex-col", white ? "bg-white hover:bg-tone" : "bg-tone hover:bg-tone-2")}>
        <span className="relative block aspect-square shrink-0 overflow-hidden rounded-[20px] bg-tone-2 max-sm:w-[104px]">
          <PersonPhoto person={person} eager={eager} />
          {cofound && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-foreground shadow-sm max-sm:hidden">
              <span aria-hidden className="size-2 rounded-full bg-cornflower" />
              Ищет сообщников
            </span>
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col px-3 pt-4 pb-3 max-sm:pt-2">
          {cofound && <span className="mb-1 text-xs font-bold text-brand-ink sm:hidden">Ищет сообщников</span>}
          <h3 className="text-lg leading-tight font-extrabold tracking-[-0.02em]">{person.display_name}</h3>
          {role && <p className="mt-0.5 text-sm text-muted-foreground">{role}</p>}
          {person.headline && <p className="mt-2.5 line-clamp-2 text-sm leading-snug">{person.headline}</p>}
          {skills.length > 0 && (
            <span className="mt-3 flex flex-wrap gap-1 pb-3" aria-label="Навыки">
              {skills.map((s) => (
                <span key={s.slug} className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", chip)}>
                  {s.name}
                </span>
              ))}
              {more > 0 && <span className={cn("rounded-full px-2 py-1 text-xs font-semibold text-muted-foreground", chip)}>+{more}</span>}
            </span>
          )}
          <span className="mt-auto flex items-center gap-2 border-t border-foreground/[0.06] pt-3 text-[13px] text-muted-foreground">
            <span className="min-w-0 truncate">{person.city || (terms.length ? terms.join(", ") : "")}</span>
            <span className="ml-auto inline-flex shrink-0 items-center gap-1 font-bold text-brand-ink">
              Профиль
              <ArrowRight aria-hidden className="size-3.5" />
            </span>
          </span>
        </div>
      </Link>
    </Tag>
  );
}
