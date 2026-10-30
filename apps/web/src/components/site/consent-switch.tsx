"use client";

import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { getConsent, setConsent, subscribeConsent } from "@/lib/metrika";

/** KAN-132: поменять решение про аналитические cookie. Отказ вступает в силу со следующей загрузки. */
export function ConsentSwitch() {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, () => null);
  const label = consent === "all" ? "разрешена" : consent === "necessary" ? "отключена" : "ещё не выбрано";
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border p-4 text-sm">
      <p className="flex-1">
        Яндекс Метрика: <b>{label}</b>
      </p>
      {consent === "all" ? (
        <Button size="sm" variant="outline" onClick={() => setConsent("necessary")}>
          Отключить
        </Button>
      ) : (
        <Button size="sm" variant="ink" onClick={() => setConsent("all")}>
          Разрешить
        </Button>
      )}
    </div>
  );
}
