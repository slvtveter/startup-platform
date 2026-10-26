"use client";

import { useState } from "react";
import { toast } from "sonner";

import { SettingRow, SettingsCard } from "@/components/domain/settings-panel";
import { Switch } from "@/components/ui/switch";
import { updateEmailPrefs, type EmailPrefOut } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

/** Какие письма присылать (KAN-74). Сохраняется сразу при переключении. */
export function EmailPrefs({ initial }: { initial: EmailPrefOut[] }) {
  const [prefs, setPrefs] = useState(initial);

  async function toggle(kind: string, enabled: boolean) {
    setPrefs((list) => list.map((p) => (p.kind === kind ? { ...p, enabled } : p)));
    const { data, error } = await updateEmailPrefs({ body: { prefs: { [kind]: enabled } } });
    if (error) {
      setPrefs((list) => list.map((p) => (p.kind === kind ? { ...p, enabled: !enabled } : p)));
      return toast.error(errorMessage(error));
    }
    setPrefs(data!);
    toast.success(enabled ? "Будем присылать" : "Больше не пришлём");
  }

  return (
    <SettingsCard id="notifications" title="Уведомления" description="Письма о входе, подтверждении почты и сбросе пароля приходят всегда.">
      {prefs.map((p) => (
        <SettingRow key={p.kind} title={p.label}>
          <Switch checked={p.enabled} onChange={(v) => toggle(p.kind, v)} aria-label={p.label} />
        </SettingRow>
      ))}
    </SettingsCard>
  );
}
