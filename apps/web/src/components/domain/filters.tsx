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
