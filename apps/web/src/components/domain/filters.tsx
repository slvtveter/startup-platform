import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export type Option = { value: string; label: string; count?: number };
export type SearchParams = Record<string, string | string[] | undefined>;

export function asList(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

/** URL каталога с переключённым значением фильтра; страница сбрасывается на первую. */
export function toggleHref(basePath: string, params: SearchParams, name: string, value: string | null) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k === "page") continue;
    for (const x of asList(v)) if (!(k === name && (value === null || x === value))) q.append(k, x);
  }
  if (value !== null && !asList(params[name]).includes(value)) q.append(name, value);
  const s = q.toString();
  return s ? `${basePath}?${s}` : basePath;
}

/**
 * Быстрый фильтр на виду: один ряд переключателей одной группы (не переносится, прокручивается вбок) («Все», «Идеи», «MVP»…).
 * «Все» снимает группу; остальные можно выбрать несколько. Ссылки — работает без JS.
 */
export function QuickChips({
  basePath,
  params,
  name,
  options,
  allLabel = "Все",
}: {
  basePath: string;
  params: SearchParams;
  name: string;
  options: Option[];
  allLabel?: string;
}) {
  const selected = asList(params[name]);
  const chip = "inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors";
  const on = "bg-foreground text-background";
  const off = "bg-tone text-foreground hover:bg-tone-2";
  const onHover = "hover:bg-[#1d2a3f]";
  return (
    <nav aria-label="Быстрый фильтр" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [mask-image:linear-gradient(90deg,#000_88%,transparent)] [scrollbar-width:none] sm:mx-0 sm:px-0">
      <Link href={toggleHref(basePath, params, name, null)} scroll={false} aria-current={selected.length === 0 ? "true" : undefined} className={`${chip} ${selected.length === 0 ? `${on} ${onHover}` : off}`}>
        {allLabel}
      </Link>
      {options.map((o) => {
        const active = selected.includes(o.value);
        return (
          <Link key={o.value} href={toggleHref(basePath, params, name, o.value)} scroll={false} aria-current={active ? "true" : undefined} className={`${chip} ${active ? `${on} ${onHover}` : off}`}>
            {o.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Pager({ basePath, params, total, limit, page }: { basePath: string; params: SearchParams; total: number; limit: number; page: number }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (k !== "page") for (const x of asList(v)) q.append(k, x);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <nav className="mt-8 flex items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} className={buttonVariants({ variant: "outline" })}>
          Назад
        </Link>
      )}
      <span className="px-3 text-sm text-muted-foreground">
        {page} из {pages}
      </span>
      {page < pages && (
        <Link href={href(page + 1)} className={buttonVariants({ variant: "outline" })}>
          Дальше
        </Link>
      )}
    </nav>
  );
}
