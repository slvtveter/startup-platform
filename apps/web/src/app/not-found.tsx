import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Страница не найдена", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 pt-2 pb-10 sm:px-6 lg:px-10">
      <div className="grid min-h-[60svh] place-items-center rounded-[36px] bg-tone px-6 py-16 text-center">
        <div>
          <p className="text-sm font-bold tracking-wide text-brand-ink uppercase">Ошибка 404</p>
          <h1 className="mt-3 text-[clamp(36px,5vw,64px)] leading-[1.02]">Такой страницы нет</h1>
          <p className="mx-auto mt-4 max-w-[42ch] text-[17px] text-muted-foreground">
            Возможно, проект закрыли или профиль скрыли из каталога. Загляни в идеи или найди людей.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            <Link href="/startups" className={buttonVariants({ size: "lg" })}>
              Идеи и стартапы
            </Link>
            <Link href="/" className={buttonVariants({ variant: "light", size: "lg" })}>
              На главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
