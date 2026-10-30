import type { Metadata } from "next";

import { WelcomeChoice } from "@/components/landing/welcome-choice";
import { requireMe } from "@/lib/server-api";

export const metadata: Metadata = { title: "С чего начнёшь?", robots: { index: false } };

/** Первый экран после регистрации: развилка по сценарию вместо пустого профиля. */
export default async function WelcomePage() {
  await requireMe("/welcome");
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pt-10 pb-16 sm:px-6">
      <ol aria-label="Первые шаги" className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-bold">
        {["Цель", "Профиль", "Первый шаг"].map((t, i) => (
          <li key={t} className="flex items-center gap-2">
            <span className={i === 0 ? "grid size-7 place-items-center rounded-full bg-brand text-white" : "grid size-7 place-items-center rounded-full bg-tone text-muted-foreground"}>{i + 1}</span>
            <span className={i === 0 ? "" : "text-muted-foreground"}>{t}</span>
            {i < 2 && <span aria-hidden className="h-px w-6 bg-border" />}
          </li>
        ))}
      </ol>
      <h1 className="mt-3 text-[32px] sm:text-[48px] lg:text-[56px] leading-[1.04]">С чего начнёшь?</h1>
      <p className="mt-3 max-w-[52ch] text-lg text-muted-foreground">
        Выбери, что тебе ближе. Передумать можно в любой момент.
      </p>
      <div className="mt-8">
        <WelcomeChoice />
      </div>
    </div>
  );
}
