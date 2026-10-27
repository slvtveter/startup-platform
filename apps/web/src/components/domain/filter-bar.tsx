"use client";

import { ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { asList, toggleHref, type Option, type SearchParams } from "@/components/domain/filters";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type FilterGroup = { name: string; title: string; options: Option[] };

/**
 * Фильтры в одну строку, как на hh.ru и Ozon: у каждой группы своя кнопка с выпадающим списком,
 * а выбранные значения видны чипами под ней — их можно снять по одному или все сразу.
 * Состояние живёт в URL, поэтому ссылкой на подборку можно поделиться.
 */
export function FilterBar({ basePath, params, groups }: { basePath: string; params: SearchParams; groups: FilterGroup[] }) {
  const router = useRouter();
  const go = (href: string) => router.push(href, { scroll: false });
  const chips = groups.flatMap((g) =>
    asList(params[g.name]).map((v) => ({ group: g, value: v, label: g.options.find((o) => o.value === v)?.label ?? v })),
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => {
          const selected = asList(params[g.name]);
          return (
            <DropdownMenu key={g.name}>
              <DropdownMenuTrigger
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold shadow-[inset_0_0_0_1.5px_var(--border)] transition-colors duration-200 outline-none hover:bg-tone focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected.length > 0 && "bg-brand-soft text-brand-ink shadow-[inset_0_0_0_1.5px_var(--cornflower)] hover:bg-brand-soft",
                )}
              >
                {g.title}
                {selected.length > 0 && (
                  <span className="grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">{selected.length}</span>
                )}
                <ChevronDown aria-hidden className="size-4 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-80 w-64">
                {g.options.map((o) => (
                  <DropdownMenuCheckboxItem
                    key={o.value}
                    checked={selected.includes(o.value)}
                    onCheckedChange={() => go(toggleHref(basePath, params, g.name, o.value))}
                    className="py-2"
                  >
                    {o.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <Link
              key={`${c.group.name}=${c.value}`}
              href={toggleHref(basePath, params, c.group.name, c.value)}
              scroll={false}
              aria-label={`Убрать фильтр: ${c.label}`}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-tone pr-2 pl-3 text-sm font-medium transition-colors duration-200 hover:bg-tone-2"
            >
              {c.label}
              <X aria-hidden className="size-3.5" />
            </Link>
          ))}
          <Link href={basePath} scroll={false} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            Сбросить всё
          </Link>
        </div>
      )}
    </div>
  );
}
