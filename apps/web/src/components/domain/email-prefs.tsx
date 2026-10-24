"use client";

import { useState } from "react";
import { toast } from "sonner";

import { updateEmailPrefs, type EmailPrefOut } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

/** Какие письма присылать (KAN-74). Сохраняется сразу при переключении. */
export function EmailPrefs({ initial }: { initial: EmailPrefOut[] }) {
  const [prefs, setPrefs] = useState(initial);

  async function toggle(kind: string, enabled: boolean) {
    const { data, error } = await updateEmailPrefs({ body: { prefs: { [kind]: enabled } } });
    if (error) return toast.error(errorMessage(error));
    setPrefs(data!);
    toast.success(enabled ? "Будем присылать" : "Больше не пришлём");
  }

  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="font-sans text-lg font-bold tracking-normal">Письма</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Письма о входе, подтверждении почты и сбросе пароля приходят всегда.
      </p>
      <ul className="mt-4 grid gap-3">
        {prefs.map((p) => (
          <li key={p.kind}>
            <label className="flex cursor-pointer items-center gap-3 text-[15px]">
              <input
                type="checkbox"
                checked={p.enabled}
                onChange={(e) => toggle(p.kind, e.target.checked)}
                className="size-4 accent-[var(--brand)]"
              />
              {p.label}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
