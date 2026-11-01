"use client";

import { XIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import type { SkillOut } from "@/lib/api";

/** Какие категории навыков подсказывать первыми для роли (slug роли → категории). */
const ROLE_CATEGORIES: Record<string, string[]> = {
  frontend: ["dev", "design"], backend: ["dev", "data"], mobile: ["dev", "design"], fullstack: ["dev"], gamedev: ["dev", "design"],
  devops: ["dev"], qa: ["dev", "product"], designer: ["design", "product"], "motion-designer": ["design"], "ux-researcher": ["design", "product"],
  analyst: ["data", "product"], ml: ["data", "dev"], "data-engineer": ["data", "dev"], "data-scientist": ["data", "dev"],
  marketer: ["marketing", "product"], smm: ["marketing"], copywriter: ["marketing"], community: ["marketing"], video: ["marketing", "design"],
  sales: ["marketing", "product"], product: ["product", "data"], project: ["product"], "business-analyst": ["product", "data"], hr: ["product"],
};

export function SkillPicker({
  all,
  value,
  onChange,
  max = 20,
  role,
}: {
  all: SkillOut[];
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
  /** Slug основной роли: без запроса сначала подсказываем навыки её категорий, а не по алфавиту. */
  role?: string | null;
}) {
  const [q, setQ] = useState("");
  const bySlug = useMemo(() => new Map(all.map((s) => [s.slug, s])), [all]);
  const suggestions = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const prefer = ROLE_CATEGORIES[role ?? ""] ?? [];
    const rank = (s: SkillOut) => {
      const i = prefer.indexOf(s.category ?? "");
      return i === -1 ? prefer.length : i;
    };
    return all
      .filter((s) => !value.includes(s.slug))
      // Совпадение с началом слова: «UX» находит «UX исследования», но не «Linux».
      .filter((s) => !needle || s.name.toLowerCase().split(/[\s./-]+/).some((w) => w.startsWith(needle)) || s.name.toLowerCase().startsWith(needle))
      .sort((a, b) => rank(a) - rank(b))
      .slice(0, needle ? 12 : 12);
  }, [all, q, value, role]);

  return (
    <div className="grid gap-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => onChange(value.filter((v) => v !== slug))}
              className="inline-flex items-center gap-1 rounded-full bg-second px-3 py-1.5 text-sm font-semibold text-on-second"
            >
              {bySlug.get(slug)?.name ?? slug} <XIcon className="size-3.5" />
            </button>
          ))}
        </div>
      )}
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          // Enter добавляет первый подходящий навык, а не отправляет форму.
          if (e.key !== "Enter") return;
          e.preventDefault();
          const first = q.trim() && suggestions[0];
          if (first && value.length < max) {
            onChange([...value, first.slug]);
            setQ("");
          }
        }}
        placeholder="Начни вводить: Figma, React, SEO..."
        className="h-11"
      />
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s.slug}
            type="button"
            disabled={value.length >= max}
            onClick={() => {
              onChange([...value, s.slug]);
              setQ("");
            }}
            className="rounded-full border px-3 py-1.5 text-sm font-semibold hover:border-foreground disabled:opacity-40"
          >
            + {s.name}
          </button>
        ))}
        {suggestions.length === 0 && (
          <span className="text-sm text-muted-foreground">Такого навыка пока нет в списке — выбери близкий или напиши о нём в «О себе».</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Выбрано {value.length} из {max}
      </p>
    </div>
  );
}
