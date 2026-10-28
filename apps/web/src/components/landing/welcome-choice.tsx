"use client";

import { ArrowRight, Lightbulb, Users, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { getMyProfile, updateMyProfile, type LookingFor } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

const CHOICES = [
  {
    key: "idea",
    icon: Lightbulb,
    title: "Есть идея",
    text: "Опишу её в двух абзацах и отмечу, кого не хватает.",
    next: "/me/profile?welcome=idea",
  },
  {
    key: "cofound",
    icon: Users,
    title: "Нет идеи, ищу сообщников",
    text: "Хочу найти людей и вместе придумать стартап с нуля.",
    next: "/me/profile?welcome=cofound",
  },
  {
    key: "join",
    icon: Rocket,
    title: "Хочу в команду",
    text: "Найду стартап, который уже работает и ищет людей.",
    next: "/me/profile?welcome=join",
  },
] as const;

export function WelcomeChoice() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function choose(c: (typeof CHOICES)[number]) {
    setBusy(c.key);
    if (c.key === "cofound") {
      // Сразу отмечаем «Ищу сообщников»: человек попадёт в раздел, как только заполнит профиль.
      const { data } = await getMyProfile();
      const current = (data?.looking_for ?? []) as LookingFor[];
      const { error } = await updateMyProfile({ body: { looking_for: [...new Set<LookingFor>([...current, "cofound"])] } });
      if (error) {
        setBusy(null);
        return toast.error(errorMessage(error));
      }
    }
    router.push(c.next);
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {CHOICES.map((c) => (
        <button
          key={c.key}
          type="button"
          disabled={busy !== null}
          onClick={() => choose(c)}
          className={cn(
            "card-hover group flex flex-col items-start gap-4 rounded-[28px] p-6 text-left disabled:opacity-60",
            c.key === "cofound" ? "bg-brand-soft hover:bg-marker" : "bg-tone hover:bg-tone-2",
          )}
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-white text-brand-ink">
            <c.icon aria-hidden className="size-6" />
          </span>
          <span>
            <span className="block text-2xl leading-tight font-extrabold tracking-[-0.03em]">{c.title}</span>
            <span className="mt-2 block text-muted-foreground">{c.text}</span>
          </span>
          <span className="mt-auto inline-flex items-center gap-1.5 pt-2 font-bold text-brand-ink">
            {busy === c.key ? "Секунду…" : "Выбрать"}
            <ArrowRight aria-hidden className="size-4" />
          </span>
        </button>
      ))}
    </div>
  );
}
