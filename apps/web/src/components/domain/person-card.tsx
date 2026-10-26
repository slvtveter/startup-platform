import Link from "next/link";

import { Avatar } from "@/components/domain/avatar-upload";
import { DemoBadge, SkillChip } from "@/components/domain/badges";
import type { PersonCard as PersonCardData } from "@/lib/api";
import { AVAILABILITY, LEVEL, TERMS, initials } from "@/lib/labels";

export function PersonAvatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const cls = size === "lg" ? "size-20 rounded-2xl text-2xl" : "size-12 text-base";
  return (
    <span className={`grid shrink-0 place-items-center rounded-xl bg-foreground font-bold text-background ${cls}`}>
      {initials(name)}
    </span>
  );
}

/**
 * Карточка человека в каталоге (KAN-138 п.3): отдельная крупная карточка в списке, как резюме —
 * шапка (фото, роль, имя, статус) и строки «подпись — значение». Пустые строки не рисуем.
 */
export function PersonListCard({ person }: { person: PersonCardData }) {
  const title = person.primary_role?.name || person.headline || "Ищет первый проект";
  const terms = person.looking_for.map((t) => TERMS[t]?.toLowerCase()).filter(Boolean).join(", ");
  const skills = person.skills.slice(0, 6);
  const more = person.skills.length - skills.length;
  const rows: [string, React.ReactNode][] = [];
  if (person.headline && person.primary_role) rows.push(["О себе", person.headline]);
  if (person.experience_level) rows.push(["Опыт", LEVEL[person.experience_level]]);
  if (skills.length)
    rows.push([
      "Навыки",
      <span key="s" className="flex flex-wrap gap-1">
        {skills.map((s) => (
          <SkillChip key={s.slug} name={s.name} />
        ))}
        {more > 0 && <span className="self-center px-1 text-xs text-muted-foreground">+{more}</span>}
      </span>,
    ]);
  if (terms) rows.push(["Условия", terms[0].toUpperCase() + terms.slice(1)]);
  if (person.availability) rows.push(["Время", AVAILABILITY[person.availability]]);

  return (
    <li>
      <Link
        href={`/people/${person.slug}`}
        className="group block rounded-3xl border bg-card p-5 transition-[border-color,box-shadow] duration-200 ease-out hover:border-foreground/30 hover:shadow-[0_12px_32px_-16px_rgb(18_22_51/0.25)] sm:p-7"
      >
        <div className="flex gap-4 sm:gap-6">
          <Avatar name={person.display_name} url={person.avatar_url} className="size-20 rounded-2xl text-2xl sm:size-28 sm:text-3xl" />
          <div className="min-w-0 flex-1">
            <h3 className="font-sans text-xl leading-tight font-bold tracking-normal text-brand-ink group-hover:underline sm:text-2xl">{title}</h3>
            <p className="mt-1.5 text-[15px]">
              <span className="font-medium">{person.display_name}</span>
              {person.city && <span className="text-muted-foreground"> · {person.city}</span>}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-lg bg-success-soft px-2.5 py-1 text-sm font-medium text-success-ink">Ищет проект</span>
              {person.is_demo && <DemoBadge className="self-center" />}
            </div>
          </div>
        </div>
        {rows.length > 0 && (
          <dl className="mt-5 divide-y border-t text-sm sm:text-[15px]">
            {rows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[5.5rem_1fr] gap-3 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="min-w-0">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Link>
    </li>
  );
}
