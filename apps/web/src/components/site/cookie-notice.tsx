"use client";

import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { getConsent, setConsent, subscribeConsent } from "@/lib/metrika";

/**
 * KAN-130, KAN-132: сессионная cookie необходима, а cookie Яндекс Метрики — нет,
 * поэтому спрашиваем согласие. Пока посетитель не нажал «Принять», счётчик не загружается.
 * Выбор хранится в localStorage; поменять его можно на странице /cookies.
 */
export function CookieNotice() {
  // На сервере плашку не рисуем: о localStorage знает только браузер.
  const open = useSyncExternalStore(subscribeConsent, getConsent, () => "necessary" as const) === null;
  const ref = useRef<HTMLElement>(null);

  // Пока плашка на экране, закреплённые снизу панели (кнопка «Выбрать место» на телефоне)
  // поднимаются над ней через --cookie-offset, а не прячутся под ней.
  useEffect(() => {
    const el = ref.current;
    if (!open || !el) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty("--cookie-offset", `${el.offsetHeight + 12}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--cookie-offset");
    };
  }, [open]);

  if (!open) return null;
  return (
    <section
      ref={ref}
      role="region"
      aria-label="Cookie"
      className="cookie-in fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-md flex-wrap items-center gap-3 rounded-2xl bg-card p-3 pl-4 text-sm shadow-[0_0_0_1px_var(--border),0_20px_50px_-12px_rgb(15_27_45/0.25)]"
    >
      <p className="min-w-56 flex-1 text-muted-foreground">
        Cookie нужны для входа в аккаунт, а с вашего согласия ещё и для Яндекс Метрики: она помогает понять, что на
        сайте неудобно.{" "}
        <Link href="/cookies" className="font-semibold text-foreground underline">
          Подробнее
        </Link>
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => setConsent("necessary")}>
          Только нужные
        </Button>
        <Button size="sm" variant="ink" onClick={() => setConsent("all")}>
          Принять
        </Button>
      </div>
    </section>
  );
}
