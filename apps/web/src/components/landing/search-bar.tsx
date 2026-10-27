"use client";

import { SearchIcon } from "lucide-react";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Один поиск на три каталога: люди, идеи (стартапы на стадии идеи) и стартапы. Это обычная GET-форма,
// поэтому без JS она тоже работает — просто ищет по вкладке, выбранной по умолчанию.
const TABS = [
  { key: "people", label: "Люди", action: "/people", placeholder: "Роль или навык: Figma, Python" },
  { key: "ideas", label: "Идеи", action: "/startups", placeholder: "Тема: учёба, еда, собаки" },
  { key: "startups", label: "Стартапы", action: "/startups", placeholder: "Роль или тема: дизайнер, ML" },
] as const;

export function SearchBar() {
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);
  return (
    <form
      role="search"
      action={tab.action}
      className="grid gap-2 rounded-[28px] bg-tone p-2.5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center"
    >
      <div role="radiogroup" aria-label="Где искать" className="flex rounded-[18px] bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="radio"
            aria-checked={t.key === tab.key}
            onClick={() => setTab(t)}
            className={cn(
              "h-[46px] flex-1 rounded-[14px] px-[18px] text-[15px] font-bold text-muted-foreground transition-colors",
              t.key === tab.key ? "bg-foreground text-background" : "hover:bg-tone hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab.key === "ideas" && <input type="hidden" name="stage" value="idea" />}
      <label className="flex h-[54px] items-center gap-3 rounded-[18px] bg-white px-[18px] focus-within:shadow-[inset_0_0_0_2px_var(--cornflower)]">
        <SearchIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
        <input
          name="q"
          placeholder={tab.placeholder}
          aria-label="Поиск"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground"
        />
      </label>
      <button type="submit" className={buttonVariants({ variant: "ink", className: "h-[54px] rounded-[18px] px-6 text-base" })}>
        Найти
      </button>
    </form>
  );
}
