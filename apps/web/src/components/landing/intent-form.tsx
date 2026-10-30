"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Option } from "@/components/domain/filters";
import { trackClientEvent } from "@/lib/api";

/** Что человек хочет сделать → куда его отправить. Роль подставляется в фильтр, где он есть. */
const INTENTS = [
  { value: "join", label: "попасть в стартап", href: (role: string) => (role ? `/startups?role=${role}` : "/startups") },
  { value: "idea", label: "подключиться к идее", href: (role: string) => `/startups?stage=idea${role ? `&role=${role}` : ""}` },
  { value: "cofound", label: "придумать стартап вместе", href: () => "/people?cofound=1" },
  { value: "team", label: "собрать команду под идею", href: () => "/register?next=/startups/new" },
] as const;

/**
 * Первый экран вместо строки поиска: фраза «Я [роль] и хочу [что] → Показать» (как у FounderCloud и Wellfound).
 * Новичку не нужно придумывать запрос: он выбирает из двух списков и сразу попадает в каталог с фильтрами.
 */
export function IntentForm({ roles }: { roles: Option[] }) {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [intent, setIntent] = useState<(typeof INTENTS)[number]["value"]>("join");
  const href = INTENTS.find((i) => i.value === intent)!.href(role);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // Развилка гипотезы H2: «собрать команду» — путь основателя, остальное — путь участника.
        void trackClientEvent({ body: { name: "landing_path_selected", path: intent === "team" ? "founder" : "seeker" } }).catch(() => {});
        router.push(href);
      }}
      className="grid max-w-[680px] gap-1 rounded-[24px] bg-white p-2 text-foreground shadow-[0_24px_60px_-20px_rgb(0_0_0/0.45)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_auto]"
    >
      <Select id="intent-role" label="Я" value={role} onChange={setRole}>
        <option value="">пока не решил</option>
        {roles.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </Select>
      <Select id="intent-goal" label="Хочу" value={intent} onChange={(v) => setIntent(v as typeof intent)}>
        {INTENTS.map((i) => (
          <option key={i.value} value={i.value}>
            {i.label}
          </option>
        ))}
      </Select>
      <button
        type="submit"
        className="inline-flex h-14 items-center justify-center gap-2 rounded-[18px] bg-brand px-7 text-base font-bold text-white transition-colors hover:bg-brand-hover focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-px"
      >
        Показать
        <ArrowRight aria-hidden className="size-4" />
      </button>
    </form>
  );
}

function Select({ id, label, value, onChange, children }: { id: string; label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="relative flex h-14 cursor-pointer flex-col justify-center rounded-[18px] pr-10 pl-4 transition-colors hover:bg-tone focus-within:bg-tone">
      <span className="text-xs leading-4 font-semibold text-muted-foreground">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none truncate bg-transparent text-base leading-6 font-bold outline-none"
      >
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" />
    </label>
  );
}
