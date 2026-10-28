"use client";

import { cn } from "@/lib/utils";

const LENGTH = 6;

/**
 * Шесть ячеек для кода из письма. Под ними одно настоящее поле: вставка, автоподстановка кода
 * на iOS/Android (one-time-code) и экранные читалки работают как с обычным input.
 */
export function CodeInput({
  id,
  value,
  onChange,
  invalid,
  disabled,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (code: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
}) {
  return (
    <div className="group relative">
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, LENGTH))}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={LENGTH}
        autoFocus
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="absolute inset-0 z-10 w-full cursor-text text-transparent caret-transparent opacity-0 outline-none selection:bg-transparent"
      />
      <div aria-hidden className="grid grid-cols-6 gap-2">
        {Array.from({ length: LENGTH }, (_, i) => {
          const active = i === Math.min(value.length, LENGTH - 1);
          return (
            <span
              key={i}
              className={cn(
                "grid h-14 place-items-center rounded-xl bg-tone text-2xl font-extrabold tabular-nums transition-colors duration-200",
                value[i] && "bg-brand-soft text-brand-ink",
                active && "group-focus-within:shadow-[inset_0_0_0_2px_var(--cornflower)]",
                invalid && "bg-destructive/10 text-destructive",
                disabled && "opacity-60",
              )}
            >
              {value[i] ?? (active ? <span className="code-caret hidden h-6 w-0.5 rounded-full bg-foreground/60 group-focus-within:block" /> : "")}
            </span>
          );
        })}
      </div>
    </div>
  );
}
