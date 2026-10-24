import Link from "next/link";

import { StageBadge, TermsBadge } from "@/components/domain/badges";
import type { StartupCard as StartupCardData } from "@/lib/api";
import { timeAgo } from "@/lib/labels";

export function StartupCard({ startup }: { startup: StartupCardData }) {
  return (
    <Link
      href={`/startups/${startup.slug}`}
      className="group flex flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-foreground"
    >
      <div className="flex flex-wrap items-center gap-2">
        <TermsBadge terms={startup.terms} />
        <StageBadge stage={startup.stage} />
        <span className="ml-auto text-xs font-medium text-muted-foreground">{timeAgo(startup.published_at)}</span>
      </div>
      <h3 className="mt-3 text-xl font-extrabold group-hover:text-brand-ink">{startup.title}</h3>
      <p className="mt-1 line-clamp-2 text-[15px] text-muted-foreground">{startup.pitch}</p>
      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
        {startup.open_roles.length ? (
          startup.open_roles.map((r) => (
            <span key={r.id} className="rounded-md bg-brand-soft px-2 py-1 text-xs font-semibold text-brand-ink">
              {r.title}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">Набор закрыт</span>
        )}
      </div>
    </Link>
  );
}
