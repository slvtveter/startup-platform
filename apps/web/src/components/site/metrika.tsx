"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { getConsent, metrikaEnabled, subscribeConsent, YM_ID } from "@/lib/metrika";

type YmFn = ((...args: unknown[]) => void) & { a?: unknown[][]; l?: number };

/** Стандартный загрузчик tag.js: очередь вызовов копится, пока скрипт не загрузился. */
function load() {
  const w = window as unknown as { ym?: YmFn };
  if (w.ym) return;
  const ym: YmFn = (...args) => (ym.a = ym.a ?? []).push(args);
  ym.l = Date.now();
  w.ym = ym;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://mc.yandex.ru/metrika/tag.js";
  document.head.appendChild(s);
  // defer: просмотры отправляем сами при каждой смене страницы, иначе SPA-переходы не посчитаются.
  // Вебвизор не записывает пароли; личные блоки (переписка, контакты) помечены классом ym-hide-content.
  ym(YM_ID, "init", { defer: true, webvisor: true, clickmap: true, trackLinks: true, accurateTrackBounce: true });
}

export function Metrika() {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, () => null);
  const pathname = usePathname();
  const prev = useRef<string | null>(null);

  useEffect(() => {
    if (consent !== "all" || !metrikaEnabled()) return;
    load();
    // Заголовок новой страницы Next проставляет чуть позже смены адреса.
    const t = setTimeout(() => {
      const url = window.location.href;
      const ym = (window as unknown as { ym: YmFn }).ym;
      ym(YM_ID, "hit", url, { referer: prev.current ?? document.referrer, title: document.title });
      prev.current = url;
    }, 300);
    return () => clearTimeout(t);
  }, [consent, pathname]);

  return null;
}
