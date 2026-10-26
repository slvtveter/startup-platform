"use client";

import { useEffect } from "react";

/** Отмечает, что приложение загрузилось: с этого момента включаются анимации переходов (globals.css). */
export function HydratedFlag() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "";
  }, []);
  return null;
}
