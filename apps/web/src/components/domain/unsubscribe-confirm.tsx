"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { unsubscribe } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

export function UnsubscribeConfirm({ u, k, t }: { u: string; k: string; t: string }) {
  const [state, setState] = useState<{ done?: string; error?: string }>({});
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    const { data, error } = await unsubscribe({ body: { u, k, t } });
    setBusy(false);
    setState(error ? { error: errorMessage(error) } : { done: data!.label });
  }

  if (state.done)
    return (
      <div>
        <h1 className="text-2xl sm:text-[32px]">Готово, больше не пришлём</h1>
        <p className="mt-3 text-muted-foreground">
          Ты отписался от писем «{state.done}». Включить их обратно можно в настройках аккаунта.
        </p>
        <Link href="/me/settings" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
          Настройки писем
        </Link>
      </div>
    );
  return (
    <div>
      <h1 className="text-2xl sm:text-[32px]">Отписаться от писем?</h1>
      <p className="mt-3 text-muted-foreground">
        Письма о входе и сбросе пароля продолжат приходить: без них нельзя восстановить доступ.
      </p>
      {state.error && <p className="mt-4 rounded-xl bg-warn-soft p-3 text-sm text-warn-ink">{state.error}</p>}
      <Button variant="brand" size="lg" className="mt-6" onClick={confirm} disabled={busy || !u || !k || !t}>
        Отписаться
      </Button>
    </div>
  );
}
