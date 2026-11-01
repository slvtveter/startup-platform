import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import { TermsBadge } from "@/components/domain/badges";
import type { StartupCard as StartupCardData } from "@/lib/api";
import { STAGE, initials, plural } from "@/lib/labels";
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
  sizes = "(min-width: 1024px) 390px, (min-width: 640px) 50vw, 100vw",
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
      <span className="text-[56px] lg:text-[64px] leading-none font-extrabold tracking-[-0.05em] opacity-90">
        {startup.title.trim()[0]?.toUpperCase() ?? "•"}
      </span>
    </span>
  );
}

/** Квадрат-логотип для карточки: обложка, уменьшенная до значка, или первая буква. */
function StartupMark({ startup, eager }: { startup: StartupCardData; eager?: boolean }) {
  if (startup.cover_url)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- обложки уже пережаты api в WebP
      <img src={startup.cover_url} alt="" loading={eager ? "eager" : "lazy"} decoding="async" className="size-12 shrink-0 rounded-2xl bg-tone-2 object-cover sm:size-14" />
    );
  const [from, to, ink] = FALLBACK[[...startup.slug].reduce((n, c) => n + c.charCodeAt(0), 0) % FALLBACK.length];
  return (
    <span
      aria-hidden
      className="grid size-12 shrink-0 place-items-center rounded-2xl text-xl font-extrabold tracking-[-0.04em] sm:size-14 sm:text-2xl"
      style={{ background: `radial-gradient(120% 120% at 15% 10%, ${to}, ${from})`, color: ink }}
    >
      {startup.title.trim()[0]?.toUpperCase() ?? "•"}
    </span>
  );
}

/**
 * Карточка стартапа — одна на весь сайт: каталог, главная, подборка в кабинете.
 * Устроена как вакансия на Хабр Карьере или Wellfound: значок, название, стадия и оплата одной строкой,
 * суть, кого ищут (роли целиком, без обрезки), основатель. Большой обложки нет: она не говорит, кого ищут.
 */
export function StartupCard({
  startup,
  reasons,
  as: Tag = "div",
  eager,
  href,
  compact = false,
}: {
  startup: StartupCardData;
  reasons?: string[];
  as?: "div" | "li";
  eager?: boolean;
  /** Куда вести вместо страницы проекта (витрина главной: таких проектов в базе нет). */
  href?: string;
  /** Плотнее: суть в одну строку, меньше отступы — четыре карточки и заголовок помещаются в один экран. */
  compact?: boolean;
}) {
  const open = startup.open_roles.reduce((n, r) => n + (r.slots ?? 1), 0);
  const team = startup.team_size ?? 1;
  const roles = startup.open_roles.slice(0, 3);
  const more = startup.open_roles.length - roles.length;
  return (
    <Tag className="h-full">
      <Link href={href ?? `/startups/${startup.slug}`} className={cn("card-hover group flex h-full flex-col rounded-[20px] bg-tone p-4 hover:bg-tone-2 sm:rounded-3xl sm:p-5", !compact && "sm:p-6")}>
        <span className="flex items-center gap-3 sm:gap-4">
          <StartupMark startup={startup} eager={eager} />
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-2">
              <h3 className="truncate text-lg leading-6 font-extrabold sm:text-xl sm:leading-7 tracking-[-0.03em] text-brand-ink transition-colors group-hover:text-brand-hover" title={startup.title}>
                {startup.title}
              </h3>
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm sm:mt-1">
              <span className="font-semibold">{STAGE[startup.stage] ?? startup.stage}</span>
              <span aria-hidden className="text-muted-foreground">·</span>
              <TermsBadge terms={startup.terms} className="px-2 py-0.5" />
              {/* Пример — тихо, в конце служебной строки: карточка не должна кричать, что она ненастоящая. */}
              {startup.is_demo && <span className="text-xs whitespace-nowrap text-muted-foreground">· пример</span>}
            </span>
          </span>
        </span>

        <p className={cn("text-sm leading-5 text-foreground/80 sm:text-base sm:leading-6", compact ? "mt-3 line-clamp-1" : "mt-3 line-clamp-2 sm:mt-4")}>{startup.pitch}</p>

        {roles.length > 0 ? (
          <span className={cn("flex flex-wrap gap-1.5", compact ? "mt-3" : "mt-3 sm:mt-4")} aria-label="Кого ищут">
            {roles.map((r) => (
              <span key={r.id} className="rounded-full bg-white px-2.5 py-0.5 text-xs leading-5 font-semibold sm:px-3 sm:py-1 sm:text-sm">
                {r.title}
              </span>
            ))}
            {more > 0 && <span className="rounded-full bg-white px-2.5 py-0.5 text-xs leading-5 font-semibold text-muted-foreground sm:px-3 sm:py-1 sm:text-sm">ещё {more}</span>}
          </span>
        ) : (
          <span className="mt-4 text-sm text-muted-foreground">Команда собрана</span>
        )}

        {reasons && reasons.length > 0 && (
          <span className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Почему подходит">
            {reasons.slice(0, 2).map((r, i) => (
              <span key={r} className={cn("inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand-ink", i > 0 && "max-sm:hidden")}>
                <Check aria-hidden className="size-3 shrink-0" />
                {reasonLabel(r)}
              </span>
            ))}
          </span>
        )}

        <span className={cn("mt-auto", compact ? "pt-4" : "pt-4 sm:pt-5")}>
          <span className={cn("flex items-center gap-2 border-t border-foreground/[0.08] text-sm text-muted-foreground", compact ? "pt-3" : "pt-3 sm:pt-4")}>
            {startup.owner_avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- аватары уже пережаты api в WebP
              <img src={startup.owner_avatar_url} alt="" loading="lazy" decoding="async" className="size-6 shrink-0 rounded-full bg-tone-2 object-cover sm:size-7" />
            ) : (
              <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-[11px] font-extrabold text-brand-ink sm:size-7">
                {initials(startup.owner_name)}
              </span>
            )}
            <span className="min-w-0 truncate">
              <span className="font-semibold text-foreground">{startup.owner_name}</span>
              {team > 1 ? ` и ещё ${team - 1}` : ""}
            </span>
            {open > 0 && (
              <span className="ml-auto inline-flex shrink-0 items-center gap-1 font-bold text-brand-ink">
                <span className="sm:hidden">{plural(open, `${open} место`, `${open} места`, `${open} мест`)}</span>
                <span className="max-sm:hidden">{plural(open, `${open} свободное место`, `${open} свободных места`, `${open} свободных мест`)}</span>
                <ArrowRight aria-hidden className="size-3.5" />
              </span>
            )}
          </span>
        </span>
      </Link>
    </Tag>
  );
}
