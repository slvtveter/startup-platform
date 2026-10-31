"use client";

import { Tabs } from "@base-ui/react/tabs";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";


export type FeedTab = { value: string; label: string; count?: number; more: { href: string; label: string }; content: React.ReactNode };

/**
 * Лента главной: вкладки «Стартапы | Идеи» и ссылка на весь раздел в одной строке над карточками.
 * Карточки рендерит сервер, здесь только переключение.
 */
export function HomeFeed({ tabs }: { tabs: FeedTab[] }) {
  const [value, setValue] = useState(tabs[0]?.value);
  const more = tabs.find((t) => t.value === value)?.more;
  return (
    <Tabs.Root value={value} onValueChange={(v) => setValue(v as string)}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <Tabs.List className="relative inline-flex max-w-full overflow-x-auto rounded-full bg-tone p-1 [scrollbar-width:none]">
          {tabs.map((t) => (
            <Tabs.Tab
              key={t.value}
              value={t.value}
              className="relative z-10 inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm sm:px-5 sm:text-base font-semibold text-muted-foreground transition-colors duration-300 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[active]:font-bold data-[active]:text-foreground"
            >
              {t.label}
              {t.count ? <span className="text-sm font-semibold text-muted-foreground tabular-nums">{t.count}</span> : null}
            </Tabs.Tab>
          ))}
          <Tabs.Indicator className="absolute top-1 left-0 h-11 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] rounded-full bg-white shadow-[0_1px_3px_rgb(15_27_45/0.12)] transition-[translate,width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none" />
        </Tabs.List>
        {more && (
          <Link href={more.href} className="inline-flex items-center gap-1.5 font-bold text-brand-ink transition-colors hover:text-brand-hover">
            {more.label}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        )}
      </div>
      {tabs.map((t) => (
        <Tabs.Panel key={t.value} value={t.value} className="mt-6 outline-none data-[hidden]:hidden">
          <div className="animate-[enter-up_420ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none">{t.content}</div>
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}
