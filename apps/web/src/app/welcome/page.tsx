import type { Metadata } from "next";

import { WelcomeChoice } from "@/components/landing/welcome-choice";
import { requireMe } from "@/lib/server-api";

export const metadata: Metadata = { title: "С чего начнёшь?", robots: { index: false } };

/** Первый экран после регистрации: развилка по сценарию вместо пустого профиля. */
export default async function WelcomePage() {
  await requireMe("/welcome");
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pt-10 pb-16 sm:px-6">
      <p className="text-sm font-bold tracking-wide text-brand-ink uppercase">Добро пожаловать</p>
      <h1 className="mt-3 text-[32px] sm:text-[48px] lg:text-[56px] leading-[1.04]">С чего начнёшь?</h1>
      <p className="mt-3 max-w-[52ch] text-lg text-muted-foreground">
        Выбери, что ближе сейчас. Дальше подстроим профиль и покажем тех, кто тебе подходит. Передумать можно в любой момент.
      </p>
      <div className="mt-8">
        <WelcomeChoice />
      </div>
    </div>
  );
}
