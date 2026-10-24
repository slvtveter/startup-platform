"use client";

import { useEffect } from "react";

import { trackClientEvent, type ClientEventIn } from "@/lib/api";

/** Пишет клиентское событие один раз при показе страницы (метрики гипотез, docs/events.md). */
export function TrackView({ name, slug }: { name: ClientEventIn["name"]; slug?: string }) {
  useEffect(() => {
    void trackClientEvent({ body: { name, slug } }).catch(() => {});
  }, [name, slug]);
  return null;
}
