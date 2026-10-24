"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { inboxSeen } from "@/lib/api";

/** Отмечает раздел просмотренным при открытии страницы и обновляет счётчик в шапке. */
export function MarkSeen({ section }: { section: "mine" | "incoming" }) {
  const router = useRouter();
  useEffect(() => {
    void inboxSeen({ body: { section } }).then(() => router.refresh());
  }, [section, router]);
  return null;
}
