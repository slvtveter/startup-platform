"use client";

import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const KEY = "cookie-notice";

/**
 * KAN-130: у нас одна необходимая cookie (сессия), поэтому согласие не нужно, только сообщение.
 * Флаг в localStorage; если хранилище недоступно, плашка просто покажется снова.
 */
const listeners = new Set<() => void>();
let dismissed = false;

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function isDismissed() {
  if (dismissed) return true;
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function CookieNotice() {
  // На сервере плашку не рисуем: о localStorage знает только браузер.
  const open = !useSyncExternalStore(subscribe, isDismissed, () => true);
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

  function dismiss() {
    dismissed = true;
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    listeners.forEach((cb) => cb());
  }

  if (!open) return null;
  return (
    <section
      ref={ref}
      role="region"
      aria-label="Cookie"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-xl border bg-card p-3 text-sm shadow-lg sm:inset-x-auto sm:left-4"
    >
      <p className="flex-1 text-muted-foreground">
        Мы используем только необходимые cookie, чтобы вы могли войти в аккаунт.{" "}
        <Link href="/cookies" className="font-semibold text-foreground underline">
          Подробнее
        </Link>
      </p>
      <Button size="sm" onClick={dismiss}>
        Понятно
      </Button>
    </section>
  );
}
