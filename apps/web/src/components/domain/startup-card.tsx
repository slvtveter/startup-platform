import Link from "next/link";

import { StageBadge, TermsBadge } from "@/components/domain/badges";
import { SeatRow } from "@/components/domain/seats";
import type { StartupCard as StartupCardData } from "@/lib/api";
import { timeAgo } from "@/lib/labels";

export function StartupCard({ startup }: { startup: StartupCardData }) {
  const open = startup.open_roles.reduce((n, r) => n + (r.slots ?? 1), 0);
  const team = startup.team_size ?? 1;
  return (
    <Link
      href={`/startups/${startup.slug}`}
      className="group flex flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-foreground"
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
      <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-muted-foreground">
        <StageBadge stage={startup.stage} />
        <span className="ml-auto">{timeAgo(startup.published_at)}</span>
      </div>
    </Link>
  );
}
