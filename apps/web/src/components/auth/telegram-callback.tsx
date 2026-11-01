"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { telegramLogin, type TelegramAuthIn } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { goal } from "@/lib/metrika";

/** oauth.telegram.org возвращает данные во фрагменте #tgAuthResult=<base64 JSON>; API проверяет подпись. */
export function TelegramCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.hash.slice(1)).get("tgAuthResult");
    let data: TelegramAuthIn | null = null;
    try {
      data = raw ? JSON.parse(atob(raw.replace(/-/g, "+").replace(/_/g, "/"))) : null;
    } catch {}
    if (!data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- данные есть только во фрагменте адреса, после монтирования
      setError("Telegram не передал данные входа.");
      return;
    }
    void telegramLogin({ body: data }).then(({ data: res, error: err }) => {
      if (err || !res) return setError(errorMessage(err));
      if (res.created) goal("signup", { method: "telegram" });
      router.replace(res.created ? "/me/profile/edit?welcome=1" : "/");
      router.refresh();
    });
  }, [router]);

  return error ? (
    <div>
      <h1 className="text-2xl">Не получилось войти</h1>
      <p className="mt-2 text-muted-foreground">{error}</p>
      <Link href="/login" className="mt-4 inline-block font-bold text-brand-ink hover:underline">
        Попробовать ещё раз
      </Link>
    </div>
  ) : (
    <p className="text-muted-foreground">Входим через Telegram…</p>
  );
}
