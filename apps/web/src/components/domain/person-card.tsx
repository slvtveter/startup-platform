import Link from "next/link";

import { Avatar } from "@/components/domain/avatar-upload";
import { DemoBadge, SkillChip } from "@/components/domain/badges";
import type { PersonCard as PersonCardData } from "@/lib/api";
import { LEVEL, TERMS, initials } from "@/lib/labels";

export function PersonAvatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const cls = size === "lg" ? "size-20 rounded-2xl text-2xl" : "size-12 text-base";
  return (
    <span className={`grid shrink-0 place-items-center rounded-xl bg-foreground font-bold text-background ${cls}`}>
      {initials(name)}
    </span>
  );
}

/**
 * Карточка человека в каталоге. Показываем только то, что человек заполнил:
 * пустые блоки не рисуем, а условия работы идут одной строкой текста, без лишних рамок.
 */
export function PersonCard({ person }: { person: PersonCardData }) {
  const role = [person.primary_role?.name, person.experience_level ? LEVEL[person.experience_level].toLowerCase() : null]
    .filter(Boolean)
    .join(", ");
  const skills = person.skills.slice(0, 4);
  const more = person.skills.length - skills.length;
  return (
    <Link
      href={`/people/${person.slug}`}
      className="group flex flex-col rounded-2xl border bg-card p-5 transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground hover:shadow-[0_8px_24px_-12px_rgb(18_22_51/0.25)]"
    >
      <div className="flex items-center gap-3">
        <Avatar name={person.display_name} url={person.avatar_url} className="size-12 rounded-xl text-base" />
        <div className="min-w-0">
          <div className="truncate text-lg font-bold group-hover:text-brand-ink">{person.display_name}</div>
          {role && <div className="truncate text-sm text-muted-foreground">{role}</div>}
        </div>
        {person.is_demo && <DemoBadge className="ml-auto self-start" />}
      </div>
      {person.headline && <p className="mt-3 line-clamp-2 text-sm text-foreground/80">{person.headline}</p>}
      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {skills.map((s) => (
            <SkillChip key={s.slug} name={s.name} />
          ))}
          {more > 0 && <span className="self-center px-1 text-xs text-muted-foreground">+{more}</span>}
        </div>
      )}
      {person.looking_for.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Готов работать: {person.looking_for.map((t) => TERMS[t].toLowerCase()).join(", ")}
        </p>
      )}
    </Link>
  );
}
