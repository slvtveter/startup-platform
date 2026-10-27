"use client";

import { Check, ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { asList, toggleHref, type Option, type SearchParams } from "@/components/domain/filters";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type FilterGroup = { name: string; title: string; options: Option[] };

/**
 * Фильтры в одну строку: у каждой группы своя кнопка с выпадающим списком (можно отметить несколько),
 * а все активные фильтры, включая текст поиска, видны чипами ниже — снимаются по одному или все сразу.
 * Состояние живёт в URL; переключения внутри меню не плодят записи в истории браузера.
 */
export function FilterBar({
  basePath,
  params,
  groups,
  chipGroups = [],
}: {
  basePath: string;
  params: SearchParams;
  groups: FilterGroup[];
  /** Группы, выбранные быстрыми чипами над строкой: показываем их среди активных, чтобы было видно всё сразу. */
  chipGroups?: FilterGroup[];
}) {
  const router = useRouter();
  const all = [...chipGroups, ...groups];
  const chips = all.flatMap((g) =>
    asList(params[g.name]).map((v) => ({ name: g.name, value: v, label: g.options.find((o) => o.value === v)?.label ?? v })),
  );
  const q = typeof params.q === "string" && params.q ? params.q : null;
  if (q) chips.unshift({ name: "q", value: q, label: `«${q}»` });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => {
          const selected = asList(params[g.name]);
          return (
            <DropdownMenu key={g.name}>
              <DropdownMenuTrigger
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-full bg-tone px-4 text-sm font-semibold transition-colors outline-none hover:bg-tone-2 focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected.length > 0 && "bg-brand-soft text-brand-ink hover:bg-marker",
                )}
              >
                {g.title}
                {selected.length > 0 && (
                  <span className="grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">{selected.length}</span>
                )}
                <ChevronDown aria-hidden className="size-4 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="bottom" className="max-h-[min(22rem,var(--available-height))] w-72 p-1.5">
                <p className="px-2 pt-1 pb-2 text-xs font-semibold text-muted-foreground">Можно выбрать несколько</p>
                {g.options.map((o) => {
                  const on = selected.includes(o.value);
                  return (
                    <DropdownMenuItem
                      key={o.value}
                      closeOnClick={false}
                      onClick={() => router.replace(toggleHref(basePath, params, g.name, o.value), { scroll: false })}
                      className="gap-2.5 rounded-lg py-2"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-[18px] shrink-0 place-items-center rounded-[5px] border-[1.5px] transition-colors",
                          on ? "border-brand bg-brand text-white" : "border-input bg-white",
                        )}
                      >
                        {on && <Check className="size-3" strokeWidth={3} />}
                      </span>
                      <span className={cn(on && "font-semibold")}>{o.label}</span>
                      <span className="sr-only">{on ? ", выбрано" : ""}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <Link
              key={`${c.name}=${c.value}`}
              href={toggleHref(basePath, params, c.name, c.name === "q" ? null : c.value)}
              scroll={false}
              aria-label={`Убрать фильтр: ${c.label}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground pr-2.5 pl-3.5 text-sm font-semibold text-background transition-colors hover:bg-[#1d2a3f]"
            >
              {c.label}
              <X aria-hidden className="size-3.5" />
            </Link>
          ))}
          <Link href={basePath} scroll={false} className="px-2 text-sm font-semibold text-brand-ink transition-colors hover:text-brand-hover">
            Сбросить всё
          </Link>
        </div>
      )}
    </div>
  );
}
