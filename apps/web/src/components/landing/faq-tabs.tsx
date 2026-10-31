"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/** 2. Вопрос — ответ рядом: слева список вопросов, справа крупный ответ (на телефоне — список с ответами). */
export function FaqTabs({ items }: { items: [string, string][] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div role="tablist" aria-orientation="vertical" className="grid content-start gap-2">
        {items.map(([q], i) => (
          <button
            key={q}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={cn(
              "flex items-center gap-4 rounded-2xl px-5 py-4 text-left text-lg font-bold transition-colors",
              i === active ? "bg-foreground text-background" : "bg-tone hover:bg-tone-2",
            )}
          >
            {q}
          </button>
        )).flatMap((btn, i) =>
          i === active
            ? [btn, <p key="a" className="px-5 pb-3 text-foreground/80 lg:hidden">{items[i][1]}</p>]
            : [btn],
        )}
      </div>
      <div role="tabpanel" className="rounded-[28px] bg-brand-soft p-7 sm:p-10 max-lg:hidden">
        <h3 className="text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em]">{items[active][0]}</h3>
        <p key={active} className="mt-5 max-w-[56ch] animate-[enter-up_360ms_cubic-bezier(0.22,1,0.36,1)_both] text-xl leading-8 text-foreground/80">
          {items[active][1]}
        </p>
      </div>
    </div>
  );
}
