"use client";

import { useEffect } from "react";

/** Отмечает, что приложение загрузилось: следующие страницы появляются с анимацией (PageEnter). */
export function HydratedFlag() {
  useEffect(() => {
    window.__envolaHydrated = true;
  }, []);
  return null;
}
