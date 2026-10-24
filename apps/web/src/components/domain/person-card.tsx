import Link from "next/link";

import { Avatar } from "@/components/domain/avatar-upload";
import { SkillChip } from "@/components/domain/badges";
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

export function PersonCard({ person }: { person: PersonCardData }) {
  return (
    <Link
      href={`/people/${person.slug}`}
      className="group flex flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-foreground"
    >
      <div className="flex items-center gap-3">
        <Avatar name={person.display_name} url={person.avatar_url} className="size-12 rounded-xl text-base" />
        <div className="min-w-0">
          <div className="truncate text-lg font-bold group-hover:text-brand-ink">{person.display_name}</div>
          <div className="truncate text-sm text-muted-foreground">
            {person.primary_role?.name ?? "Роль не указана"}
            {person.experience_level ? `, ${LEVEL[person.experience_level].toLowerCase()}` : ""}
          </div>
        </div>
      </div>
      {person.headline && <p className="mt-3 line-clamp-2 text-sm text-foreground/80">{person.headline}</p>}
      <div className="mt-3 flex flex-wrap gap-1">
        {person.skills.slice(0, 5).map((s) => (
          <SkillChip key={s.slug} name={s.name} />
        ))}
      </div>
      {person.looking_for.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
          {person.looking_for.map((t) => (
            <span key={t} className="rounded-full border px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {TERMS[t]}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
