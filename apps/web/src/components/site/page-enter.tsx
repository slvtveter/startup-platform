"use client";

import { createContext, useContext, useState } from "react";

declare global {
  interface Window {
    __envolaHydrated?: boolean;
  }
}

/** Время монтирования ближайшего PageEnter выше по дереву (0 — его нет). */
const ParentMountedAt = createContext(0);

/**
 * Обёртка страницы в шаблонах (app/template.tsx и разделов). Анимирует появление только при переходе
 * внутри сайта: при первой загрузке флага ещё нет, и страница рисуется сразу (LCP, без «мигания»
 * после загрузки JS). Флаг ставит HydratedFlag.
 *
 * Шаблоны вложены (корень → раздел): при переходе в раздел монтируются оба. Внутренний тогда
 * не анимируется, иначе сдвиг удваивается, а прозрачность перемножается.
 */
export function PageEnter({ children }: { children: React.ReactNode }) {
  const parentMountedAt = useContext(ParentMountedAt);
  const [mountedAt] = useState(() => (typeof performance !== "undefined" ? performance.now() : 0));
  const [animate] = useState(
    () =>
      typeof window !== "undefined" &&
      window.__envolaHydrated === true &&
      !(parentMountedAt && mountedAt - parentMountedAt < 100),
  );
  return (
    <ParentMountedAt.Provider value={mountedAt}>
      <div className={animate ? "page-enter" : undefined}>{children}</div>
    </ParentMountedAt.Provider>
  );
}
