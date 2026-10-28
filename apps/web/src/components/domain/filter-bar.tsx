"use client";

import { ArrowDownUp, Check, ChevronDown, SearchIcon, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { asList, toggleHref, type Option, type SearchParams } from "@/components/domain/filters";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Группа фильтра: список с галочками (можно несколько) или одиночный переключатель («Ищет сообщников»). */
export type FilterGroup = { name: string; title: string; options: Option[]; toggle?: boolean };
export type SortOption = { value: string; label: string; short: string };

const pill =
  "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
const pillOff = "bg-tone text-foreground hover:bg-tone-2";
const pillOn = "bg-brand-soft text-brand-ink hover:bg-marker";

/**
 * Панель каталога в одну строку: широкий поиск слева, справа компактные фильтры-выпадашки и сортировка.
 * На узком экране — поиск во всю ширину, под ним «Фильтры» (шторка со всеми группами) и сортировка.
 * Ниже — счётчик и активные фильтры чипами. Состояние живёт в URL, переключения не плодят историю.
 */
export function CatalogToolbar({
  basePath,
  params,
  placeholder,
  groups,
  sorts,
  summary,
  resultLabel,
}: {
  basePath: string;
  params: SearchParams;
  placeholder: string;
  groups: FilterGroup[];
  /** Варианты сортировки; первый — по умолчанию (без параметра в URL). */
  sorts?: SortOption[];
  /** Счётчик результатов: стоит слева в строке с активными фильтрами. */
  summary: React.ReactNode;
  /** «9 идей» — для кнопки «Показать» в шторке фильтров. */
  resultLabel?: string;
}) {
  const router = useRouter();
  const go = (href: string) => router.replace(href, { scroll: false });
  const q = typeof params.q === "string" && params.q ? params.q : null;

  const chips = groups.flatMap((g) =>
    asList(params[g.name]).map((v) => ({
      name: g.name,
      value: v,
      label: g.toggle ? g.title : (g.options.find((o) => o.value === v)?.label ?? v),
    })),
  );
  if (q) chips.unshift({ name: "q", value: q, label: `«${q}»` });
  const activeCount = groups.reduce((n, g) => n + asList(params[g.name]).length, 0);

  const sort = sorts ? (sorts.find((s) => s.value === params.sort) ?? sorts[0]) : null;
  const sortMenu = sorts && sort && (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(pill, "bg-transparent px-3 text-muted-foreground hover:bg-tone hover:text-foreground")} aria-label={`Сортировка: ${sort.label}`}>
        <ArrowDownUp aria-hidden className="size-4" />
        <span>
          <span className="max-sm:sr-only">Сортировка: </span>
          <span className="font-bold text-foreground">{sort.short}</span>
        </span>
        <ChevronDown aria-hidden className="size-4 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-60 p-1.5">
        {sorts.map((s, i) => (
          <DropdownMenuItem
            key={s.value}
            onClick={() => go(toggleHref(basePath, { ...params, sort: undefined }, "sort", i === 0 ? null : s.value))}
            className="gap-2.5 rounded-lg py-2"
          >
            <Check aria-hidden className={cn("size-4 text-brand", s.value !== sort.value && "invisible")} />
            <span className={cn(s.value === sort.value && "font-semibold")}>{s.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
        <form role="search" className="min-w-0 basis-full lg:flex-1 lg:basis-auto">
          {Object.entries(params).flatMap(([k, v]) =>
            k === "q" || k === "page" ? [] : asList(v).map((x) => <input key={`${k}=${x}`} type="hidden" name={k} value={x} />),
          )}
          <label className="flex h-11 min-w-0 items-center gap-3 rounded-full bg-tone px-4 transition-colors duration-200 focus-within:bg-white focus-within:shadow-[inset_0_0_0_2px_var(--cornflower)] hover:bg-tone-2">
            <SearchIcon aria-hidden className="size-[18px] shrink-0 text-muted-foreground" />
            <input
              name="q"
              type="search"
              defaultValue={q ?? ""}
              placeholder={placeholder}
              aria-label={placeholder}
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            />
          </label>
          <button type="submit" className="sr-only">
            Найти
          </button>
        </form>

        {/* Широкий экран: каждая группа — своя кнопка. */}
        <div className="hidden items-center gap-2 lg:flex">
          {groups.map((g) => {
            const selected = asList(params[g.name]);
            if (g.toggle) {
              const on = selected.includes(g.options[0].value);
              return (
                <Link
                  key={g.name}
                  href={toggleHref(basePath, params, g.name, on ? null : g.options[0].value)}
                  scroll={false}
                  replace
                  aria-current={on ? "true" : undefined}
                  className={cn(pill, on ? pillOn : pillOff)}
                >
                  <span aria-hidden className={cn("size-2 rounded-full", on ? "bg-brand" : "bg-cornflower")} />
                  {g.title}
                </Link>
              );
            }
            return (
              <DropdownMenu key={g.name}>
                <DropdownMenuTrigger className={cn(pill, selected.length > 0 ? pillOn : pillOff)}>
                  {g.title}
                  {selected.length > 0 && (
                    <span className="grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">{selected.length}</span>
                  )}
                  <ChevronDown aria-hidden className="size-4 opacity-70" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="bottom" className="max-h-[min(24rem,var(--available-height))] w-72 p-1.5">
                  <p className="px-2 pt-1 pb-2 text-xs font-semibold text-muted-foreground">Можно выбрать несколько</p>
                  {g.options.map((o) => {
                    const on = selected.includes(o.value);
                    return (
                      <DropdownMenuItem
                        key={o.value}
                        closeOnClick={false}
                        onClick={() => go(toggleHref(basePath, params, g.name, o.value))}
                        className="gap-2.5 rounded-lg py-2"
                      >
                        <Box on={on} />
                        <span className={cn(on && "font-semibold")}>{o.label}</span>
                        <span className="sr-only">{on ? ", выбрано" : ""}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
          {sortMenu}
        </div>

        {/* Узкий экран: все группы в шторке, рядом сортировка. */}
        <div className="flex w-full items-center gap-2 lg:hidden">
          <Sheet>
            <SheetTrigger className={cn(pill, activeCount > 0 ? pillOn : pillOff)}>
              <SlidersHorizontal aria-hidden className="size-4" />
              Фильтры
              {activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">{activeCount}</span>}
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85svh] gap-0 rounded-t-[28px] border-0 p-0">
              <div className="px-5 pt-5 pb-2">
                <SheetTitle className="text-xl font-extrabold tracking-[-0.02em]">Фильтры</SheetTitle>
              </div>
              <div className="grid gap-6 overflow-y-auto px-5 pt-2 pb-4">
                {groups.map((g) => {
                  const selected = asList(params[g.name]);
                  return (
                    <fieldset key={g.name}>
                      <legend className="mb-2.5 text-sm font-bold">{g.title}</legend>
                      <div className="flex flex-wrap gap-1.5">
                        {g.options.map((o) => {
                          const on = selected.includes(o.value);
                          return (
                            <button
                              key={o.value}
                              type="button"
                              aria-pressed={on}
                              onClick={() => go(toggleHref(basePath, params, g.name, o.value))}
                              className={cn(
                                "inline-flex min-h-10 items-center rounded-full px-4 py-2 text-left text-sm font-semibold transition-colors",
                                on ? "bg-foreground text-background" : "bg-tone hover:bg-tone-2",
                              )}
                            >
                              {o.label}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 border-t border-foreground/[0.08] px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
                {activeCount > 0 && (
                  <button type="button" onClick={() => go(q ? `${basePath}?q=${encodeURIComponent(q)}` : basePath)} className="px-2 text-sm font-semibold text-brand-ink">
                    Сбросить
                  </button>
                )}
                <SheetClose className="ml-auto inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-bold text-white transition-colors hover:bg-brand-hover">
                  {resultLabel ? `Показать ${resultLabel}` : "Показать"}
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
          <div className="ml-auto">{sortMenu}</div>
        </div>
      </div>

      <div className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-2">
        {summary}
        {chips.length > 0 && (
          <>
            <span aria-hidden className="h-4 w-px bg-foreground/15" />
            {chips.map((c) => (
              <Link
                key={`${c.name}=${c.value}`}
                href={toggleHref(basePath, params, c.name, c.name === "q" ? null : c.value)}
                scroll={false}
                aria-label={`Убрать фильтр: ${c.label}`}
                className="inline-flex h-8 items-center gap-1 rounded-full bg-tone pr-2 pl-3 text-[13px] font-semibold transition-colors hover:bg-tone-2"
              >
                {c.label}
                <X aria-hidden className="size-3.5 text-muted-foreground" />
              </Link>
            ))}
            <Link href={basePath} scroll={false} className="text-[13px] font-semibold text-brand-ink transition-colors hover:text-brand-hover">
              Сбросить всё
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function Box({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-[5px] border-[1.5px] transition-colors",
        on ? "border-brand bg-brand text-white" : "border-input bg-white",
      )}
    >
      {on && <Check className="size-3" strokeWidth={3} />}
    </span>
  );
}
