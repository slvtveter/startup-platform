import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import { TermsBadge } from "@/components/domain/badges";
import type { StartupCard as StartupCardData } from "@/lib/api";
import { STAGE, plural } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** Причины подбора («Совпадает навыков: 2») — короткими метками внутри карточки. */
function reasonLabel(r: string) {
  const skills = r.match(/^Совпадает навыков: (\d+)/);
  if (skills) return `${skills[1]} ${plural(Number(skills[1]), "навык совпадает", "навыка совпадают", "навыков совпадают")}`;
  if (r.startsWith("Ищут:")) return "Ищут твою роль";
  return r;
}

// Обложка без фото: мягкий градиент и первая буква. Палитра стабильна для одного и того же slug.
const FALLBACK = [
  ["#DCE6FD", "#F1F5FF", "#2B57C2"],
  ["#E4DDFB", "#F5F2FF", "#5B3FC4"],
  ["#D5F0EC", "#EFFAF8", "#0E6F6A"],
  ["#FBE3D3", "#FFF5EE", "#A4460F"],
  ["#E3E8F0", "#F6F8FB", "#0F1B2D"],
];

export function StartupCover({
  startup,
  sizes = "(min-width: 1024px) 420px, (min-width: 640px) 50vw, 100vw",
  className,
  eager = false,
}: {
  startup: Pick<StartupCardData, "slug" | "title" | "cover_url" | "cover_url_lg">;
  sizes?: string;
  className?: string;
  eager?: boolean;
}) {
  if (startup.cover_url)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- обложки уже пережаты api в WebP 800 и 1600 px
      <img
        src={startup.cover_url}
        srcSet={startup.cover_url_lg ? `${startup.cover_url} 800w, ${startup.cover_url_lg} 1600w` : undefined}
        sizes={sizes}
        alt=""
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={cn("size-full bg-tone-2 object-cover", className)}
      />
    );
  const [from, to, ink] = FALLBACK[[...startup.slug].reduce((n, c) => n + c.charCodeAt(0), 0) % FALLBACK.length];
  return (
    <span
      aria-hidden
      className={cn("grid size-full place-items-center", className)}
      style={{ background: `radial-gradient(120% 120% at 15% 10%, ${to}, ${from})`, color: ink }}
    >
      <span className="text-[clamp(56px,7vw,88px)] leading-none font-extrabold tracking-[-0.05em] opacity-90">
        {startup.title.trim()[0]?.toUpperCase() ?? "•"}
      </span>
    </span>
  );
}

/**
 * Карточка стартапа — одна на весь сайт: каталог, главная, подборка в кабинете.
 * Обложка со стадией, название и условия, суть в двух строках, кого ищут, кто основатель.
 */
export function StartupCard({
  startup,
  reasons,
  as: Tag = "div",
  eager,
}: {
  startup: StartupCardData;
  reasons?: string[];
  as?: "div" | "li";
  eager?: boolean;
}) {
  const open = startup.open_roles.reduce((n, r) => n + (r.slots ?? 1), 0);
  const team = startup.team_size ?? 1;
  const roles = startup.open_roles.slice(0, 3);
  const more = startup.open_roles.length - roles.length;
  return (
    <Tag className="h-full">
      <Link
        href={`/startups/${startup.slug}`}
        className="card-hover group flex h-full flex-col rounded-[28px] bg-tone p-2 hover:bg-tone-2"
      >
        <span className="relative block aspect-[16/9] overflow-hidden rounded-[20px]">
          <StartupCover startup={startup} eager={eager} />
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-foreground shadow-sm">
            {STAGE[startup.stage] ?? startup.stage}
          </span>
        </span>
        <div className="flex flex-1 flex-col px-4 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <h3 className="text-xl leading-tight font-extrabold tracking-[-0.03em]">{startup.title}</h3>
            <TermsBadge terms={startup.terms} className="mt-0.5 ml-auto" />
          </div>
          <span className="mt-1.5 line-clamp-2 text-[15px] leading-snug text-muted-foreground">{startup.pitch}</span>
          {roles.length > 0 && (
            <span className="mt-4 flex flex-wrap items-center gap-1.5" aria-label="Кого ищут">
              <span className="mr-0.5 text-[13px] text-muted-foreground">Ищут:</span>
              {roles.map((r) => (
                <span key={r.id} className="rounded-full bg-white px-2.5 py-1 text-[13px] font-semibold">
                  {r.title}
                </span>
              ))}
              {more > 0 && <span className="self-center px-1 text-[13px] text-muted-foreground">+{more}</span>}
            </span>
          )}
          {reasons && reasons.length > 0 && (
            <span className="mt-3 flex flex-wrap gap-1.5" aria-label="Почему подходит">
              {reasons.map((r) => (
                <span key={r} className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-ink">
                  <Check aria-hidden className="size-3" />
                  {reasonLabel(r)}
                </span>
              ))}
            </span>
          )}
          <span className="mt-auto flex items-center gap-2 border-t border-foreground/[0.06] pt-3.5 text-[13px] text-muted-foreground">
            <span className="min-w-0 truncate">
              Основатель <span className="font-semibold text-foreground">{startup.owner_name}</span>
              {team > 1 ? ` и ещё ${team - 1}` : ""}
            </span>
            <span className="ml-auto inline-flex shrink-0 items-center gap-1 font-bold text-brand-ink">
              {open > 0 ? plural(open, `${open} место`, `${open} места`, `${open} мест`) : "Подробнее"}
              <ArrowRight aria-hidden className="size-3.5" />
            </span>
          </span>
        </div>
      </Link>
    </Tag>
  );
}
