"use client";

import { useEffect } from "react";

import { trackClientEvent, type ClientEventIn } from "@/lib/api";

/** Пишет клиентское событие один раз при показе страницы (метрики гипотез, docs/events.md). */
export function TrackView({ name, slug }: { name: ClientEventIn["name"]; slug?: string }) {
  useEffect(() => {
    // Метка перехода из письма-подборки (KAN-107); остальные значения API отклонит.
    const src = new URLSearchParams(window.location.search).get("src") === "digest" ? "digest" : undefined;
    void trackClientEvent({ body: { name, slug, src } }).catch(() => {});
  }, [name, slug]);
  return null;
}
