import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

/**
 * Фильтр-чипы: каждый чип — обычная ссылка, поэтому фильтры работают без JS,
 * применяются сразу и сохраняются в URL (ссылкой можно поделиться).
 */
export function ChipFilter({
  basePath,
  params,
  name,
  title,
  options,
}: {
  basePath: string;
  params: SearchParams;
  name: string;
  title: string;
  options: Option[];
}) {
  const selected = asList(params[name]);
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-sm font-semibold text-muted-foreground max-sm:hidden">{title}</span>
      <div role="group" aria-label={title} className="flex min-w-0 gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {options.map((o) => {
          const active = selected.includes(o.value);
          return (
            <Link
              key={o.value}
              href={toggleHref(basePath, params, name, o.value)}
              aria-pressed={active}
              scroll={false}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                active ? "border-foreground bg-foreground text-background" : "bg-card hover:border-foreground",
              )}
            >
              {o.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** Поиск по тексту: GET-форма, которая сохраняет остальные фильтры скрытыми полями. */
export function SearchBox({ params, placeholder }: { params: SearchParams; placeholder: string }) {
  return (
    <form role="search" className="flex gap-2">
      {Object.entries(params).flatMap(([k, v]) =>
        k === "q" || k === "page" ? [] : asList(v).map((x) => <input key={`${k}=${x}`} type="hidden" name={k} value={x} />),
      )}
      <input
        name="q"
        defaultValue={typeof params.q === "string" ? params.q : ""}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 min-w-0 flex-1 rounded-xl border bg-card px-4 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-ring"
      />
      <Button type="submit" size="lg" className="h-11">
        Найти
      </Button>
    </form>
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
