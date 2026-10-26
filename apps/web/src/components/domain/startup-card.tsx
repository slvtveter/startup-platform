import { Check } from "lucide-react";
import Link from "next/link";

import { DemoBadge, StageBadge, TermsBadge } from "@/components/domain/badges";
import { SeatRow } from "@/components/domain/seats";
import type { StartupCard as StartupCardData } from "@/lib/api";
import { plural, timeAgo } from "@/lib/labels";

/** Причины подбора («Совпадает навыков: 2») — короткими метками внутри карточки, а не подписью под ней. */
function reasonLabel(r: string) {
  const skills = r.match(/^Совпадает навыков: (\d+)/);
  if (skills) return `${skills[1]} ${plural(Number(skills[1]), "навык совпадает", "навыка совпадают", "навыков совпадают")}`;
  if (r.startsWith("Ищут:")) return "Ищут твою роль";
  return r;
}

export function StartupCard({ startup, reasons }: { startup: StartupCardData; reasons?: string[] }) {
  const open = startup.open_roles.reduce((n, r) => n + (r.slots ?? 1), 0);
  const team = startup.team_size ?? 1;
  return (
    <Link
      href={`/startups/${startup.slug}`}
      className="group flex h-full flex-col rounded-2xl border bg-card p-5 transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground hover:shadow-[0_8px_24px_-12px_rgb(18_22_51/0.25)]"
    >
      <div className="flex items-start gap-3">
        <h3 className="text-lg leading-snug font-bold group-hover:text-brand-ink">{startup.title}</h3>
        <TermsBadge terms={startup.terms} className="mt-0.5 ml-auto" />
      </div>
      <p className="mt-1 line-clamp-2 text-[15px] text-muted-foreground">{startup.pitch}</p>

      {startup.open_roles.length > 0 && (
        <div className="mt-5 border-t pt-4">
          <div className="text-xs font-semibold text-muted-foreground">Ищут в команду</div>
          <ul className="mt-2 space-y-1.5">
            {startup.open_roles.slice(0, 3).map((r) => (
              <li key={r.id} className="flex items-baseline gap-2 text-sm">
                <span className="font-semibold">{r.title}</span>
                {r.hours_per_week ? (
                  <span className="ml-auto text-xs whitespace-nowrap text-muted-foreground">{r.hours_per_week} ч в неделю</span>
                ) : null}
              </li>
            ))}
            {startup.open_roles.length > 3 && (
              <li className="text-xs text-muted-foreground">и ещё {startup.open_roles.length - 3}</li>
            )}
          </ul>
        </div>
      )}
      <div className="mt-4">
        <SeatRow filled={team} open={open} />
      </div>
      {reasons && reasons.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Почему подходит">
          {reasons.map((r) => (
            <li key={r} className="inline-flex items-center gap-1 rounded-full bg-marker-soft px-2.5 py-0.5 text-xs font-semibold text-marker-ink">
              <Check aria-hidden className="size-3" />
              {reasonLabel(r)}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-muted-foreground">
        <StageBadge stage={startup.stage} />
        {startup.is_demo && <DemoBadge />}
        <span className="ml-auto">{timeAgo(startup.published_at)}</span>
      </div>
    </Link>
  );
}

const LOGO_TONES = [
  "bg-brand-soft text-brand-ink",
  "bg-success-soft text-success-ink",
  "bg-warn-soft text-warn-ink",
  "bg-marker-soft text-marker-ink",
  "bg-secondary text-foreground",
];

/** «Логотип» стартапа: первая буква названия; цвет стабилен для одного и того же slug. */
function StartupLogo({ title, slug }: { title: string; slug: string }) {
  const tone = LOGO_TONES[[...slug].reduce((n, c) => n + c.charCodeAt(0), 0) % LOGO_TONES.length];
  return (
    <span aria-hidden className={`grid size-20 shrink-0 place-items-center rounded-2xl font-heading text-3xl sm:size-28 sm:text-4xl ${tone}`}>
      {title.trim()[0]?.toUpperCase() ?? "•"}
    </span>
  );
}

/**
 * Стартап в каталоге (KAN-138): отдельная крупная карточка в списке, как у людей —
 * шапка (логотип, название, основатель, метки) и строки «подпись — значение».
 */
export function StartupListCard({ startup }: { startup: StartupCardData }) {
  const open = startup.open_roles.reduce((n, r) => n + (r.slots ?? 1), 0);
  const team = startup.team_size ?? 1;
  const roles = startup.open_roles.slice(0, 4);
  const rows: [string, React.ReactNode][] = [];
  if (startup.pitch) rows.push(["Идея", startup.pitch]);
  if (roles.length)
    rows.push([
      "Ищут",
      <ul key="r" className="grid gap-1">
        {roles.map((r) => (
          <li key={r.id}>
            <span className="font-semibold">{r.title}</span>
            {r.hours_per_week ? <span className="text-muted-foreground"> · {r.hours_per_week} ч в неделю</span> : null}
          </li>
        ))}
        {startup.open_roles.length > roles.length && (
          <li className="text-muted-foreground">и ещё {startup.open_roles.length - roles.length}</li>
        )}
      </ul>,
    ]);
  rows.push(["Команда", <SeatRow key="t" filled={team} open={open} />]);

  return (
    <li>
      <Link
        href={`/startups/${startup.slug}`}
        className="group block rounded-3xl border bg-card p-5 transition-[border-color,box-shadow] duration-200 ease-out hover:border-foreground/30 hover:shadow-[0_12px_32px_-16px_rgb(18_22_51/0.25)] sm:p-7"
      >
        <div className="flex gap-4 sm:gap-6">
          <StartupLogo title={startup.title} slug={startup.slug} />
          <div className="min-w-0 flex-1">
            <h3 className="font-sans text-xl leading-tight font-bold tracking-normal text-brand-ink group-hover:underline sm:text-2xl">{startup.title}</h3>
            <p className="mt-1.5 text-[15px]">
              <span className="font-medium">{startup.owner_name}</span>
              {startup.published_at && <span className="text-muted-foreground"> · {timeAgo(startup.published_at)}</span>}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {open > 0 && <span className="rounded-lg bg-success-soft px-2.5 py-1 text-sm font-medium text-success-ink">Набирает команду</span>}
              <TermsBadge terms={startup.terms} />
              <StageBadge stage={startup.stage} />
              {startup.is_demo && <DemoBadge />}
            </div>
          </div>
        </div>
        <dl className="mt-5 divide-y border-t text-sm sm:text-[15px]">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[5.5rem_1fr] gap-3 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="min-w-0">{value}</dd>
            </div>
          ))}
        </dl>
      </Link>
    </li>
  );
}
