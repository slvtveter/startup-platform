"use client";

import { XIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import type { SkillOut } from "@/lib/api";

export function SkillPicker({
  all,
  value,
  onChange,
  max = 20,
}: {
  all: SkillOut[];
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  const [q, setQ] = useState("");
  const bySlug = useMemo(() => new Map(all.map((s) => [s.slug, s])), [all]);
  const suggestions = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all
      .filter((s) => !value.includes(s.slug))
      .filter((s) => !needle || s.name.toLowerCase().includes(needle))
      .slice(0, needle ? 12 : 10);
  }, [all, q, value]);

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
