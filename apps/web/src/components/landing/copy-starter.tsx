"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** Готовое первое сообщение: нажал — текст в буфере, вставляешь в переписку и правишь. */
export function CopyStarter({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {}
      }}
      className="group flex w-full flex-col items-start gap-2.5 rounded-2xl rounded-bl-md bg-white p-4 text-left text-base leading-snug transition-colors hover:bg-tone"
    >
      <span>{text}</span>
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-brand-ink">
        {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
        <span aria-live="polite">{copied ? "Скопировано" : "Копировать"}</span>
      </span>
    </button>
  );
}
