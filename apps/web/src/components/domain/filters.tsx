import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";

export type Option = { value: string; label: string };
export type SearchParams = Record<string, string | string[] | undefined>;

export function asList(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export function FilterGroup({ name, title, options, selected }: { name: string; title: string; options: Option[]; selected: string[] }) {
  return (
    <fieldset>
      <legend className="text-sm font-extrabold">{title}</legend>
      <div className="mt-2 grid gap-1.5">
        {options.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm text-foreground/85">
            <input type="checkbox" name={name} value={o.value} defaultChecked={selected.includes(o.value)} className="size-4 accent-[var(--brand)]" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FilterActions({ resetHref }: { resetHref: string }) {
  return (
    <div className="flex gap-2">
      <Button type="submit" className="flex-1">
        Применить
      </Button>
      <Link href={resetHref} className={buttonVariants({ variant: "outline" })}>
        Сбросить
      </Link>
    </div>
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
          ← Назад
        </Link>
      )}
      <span className="px-3 text-sm text-muted-foreground">
        {page} из {pages}
      </span>
      {page < pages && (
        <Link href={href(page + 1)} className={buttonVariants({ variant: "outline" })}>
          Дальше →
        </Link>
      )}
    </nav>
  );
}
