"use client";

import { useState } from "react";

declare global {
  interface Window {
    __envolaHydrated?: boolean;
  }
}

/**
 * Обёртка страницы в шаблонах (app/template.tsx и разделов). Анимирует появление только при переходе
 * внутри сайта: при первой загрузке флага ещё нет, и страница рисуется сразу (LCP, без «мигания»
 * после загрузки JS). Флаг ставит HydratedFlag.
 */
export function PageEnter({ children }: { children: React.ReactNode }) {
  const [animate] = useState(() => typeof window !== "undefined" && window.__envolaHydrated === true);
  return <div className={animate ? "page-enter" : undefined}>{children}</div>;
}
