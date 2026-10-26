import { ChevronRightIcon } from "lucide-react";
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
 * Строка человека в каталоге (KAN-138 п.3: люди списком, а не плиткой). Колонки на десктопе:
 * кто → о себе → навыки → условия; на телефоне те же данные складываются в 2–3 строки.
 */
export function PersonRow({ person }: { person: PersonCardData }) {
  const role = [person.primary_role?.name, person.experience_level ? LEVEL[person.experience_level].toLowerCase() : null]
    .filter(Boolean)
    .join(", ");
  const skills = person.skills.slice(0, 3);
  const more = person.skills.length - skills.length;
  const terms = person.looking_for.map((t) => TERMS[t]?.toLowerCase()).filter(Boolean).join(", ");
  return (
    <li>
      <Link
        href={`/people/${person.slug}`}
        className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-4 transition-colors hover:bg-secondary/60 sm:px-5 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_minmax(0,15rem)_minmax(0,10rem)_auto]"
      >
        <div className="col-span-2 flex min-w-0 items-center gap-3 lg:col-span-1">
          <Avatar name={person.display_name} url={person.avatar_url} className="size-11 rounded-xl text-sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-bold group-hover:text-brand-ink">{person.display_name}</span>
              {person.is_demo && <DemoBadge className="shrink-0" />}
            </div>
            {role && <div className="truncate text-sm text-muted-foreground">{role}</div>}
          </div>
        </div>
        <ChevronRightIcon
          className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 lg:order-last"
          aria-hidden
        />
        <p className="col-span-3 line-clamp-2 text-sm text-foreground/80 lg:col-span-1 lg:line-clamp-1">
          {person.headline || <span className="text-muted-foreground">Пока без описания</span>}
        </p>
        {/* На десктопе одна строка: не влезший навык переносится и прячется целиком, а не режется. */}
        <div className="col-span-3 flex min-w-0 flex-wrap gap-1 lg:col-span-1 lg:h-[22px] lg:overflow-hidden [&>span]:whitespace-nowrap">
          {skills.map((s) => (
            <SkillChip key={s.slug} name={s.name} />
          ))}
          {more > 0 && <span className="self-center px-1 text-xs text-muted-foreground">+{more}</span>}
        </div>
        <div className="col-span-3 text-xs text-muted-foreground lg:col-span-1">
          {terms && <div className="truncate">{terms}</div>}
          {person.city && <div className="truncate">{person.city}</div>}
        </div>
      </Link>
    </li>
  );
}
