import { SearchIcon } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";

export type Option = { value: string; label: string };
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

/** Поиск по тексту: GET-форма, которая сохраняет остальные фильтры скрытыми полями. */
export function SearchBox({ params, placeholder }: { params: SearchParams; placeholder: string }) {
  return (
    <form role="search" className="flex gap-2">
      {Object.entries(params).flatMap(([k, v]) =>
        k === "q" || k === "page" ? [] : asList(v).map((x) => <input key={`${k}=${x}`} type="hidden" name={k} value={x} />),
      )}
      <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl bg-tone px-4 transition-colors duration-200 focus-within:bg-white focus-within:shadow-[inset_0_0_0_2px_var(--cornflower)] hover:bg-tone-2">
        <SearchIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
        <input
          name="q"
          defaultValue={typeof params.q === "string" ? params.q : ""}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
      </label>
      <Button type="submit" variant="ink" className="h-12 rounded-2xl px-6">
        Найти
      </Button>
    </form>
  );
}

/**
 * Быстрый фильтр на виду: ряд переключателей одной группы («Все», «Идеи», «MVP»…).
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
  const chip = "inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-200";
  const on = "bg-foreground text-background";
  const off = "bg-tone text-foreground hover:bg-tone-2";
  return (
    <nav aria-label="Быстрый фильтр" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      <Link href={toggleHref(basePath, params, name, null)} scroll={false} aria-current={selected.length === 0 ? "true" : undefined} className={`${chip} ${selected.length === 0 ? on : off}`}>
        {allLabel}
      </Link>
      {options.map((o) => {
        const active = selected.includes(o.value);
        return (
          <Link key={o.value} href={toggleHref(basePath, params, name, o.value)} scroll={false} aria-current={active ? "true" : undefined} className={`${chip} ${active ? on : off}`}>
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
