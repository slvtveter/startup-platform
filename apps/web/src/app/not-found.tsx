import type { Metadata } from "next";
import Link from "next/link";

import { Sticker } from "@/components/brand/stickers";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Страница не найдена", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 pt-2 pb-10 sm:px-6 lg:px-10">
      <div className="relative grid min-h-[60svh] place-items-center overflow-hidden rounded-[36px] bg-tone px-6 py-16 text-center">
        <Sticker name="cursor" className="absolute top-10 left-[8%] size-20 -rotate-12 max-md:hidden" />
        <Sticker name="arrow" className="absolute right-[9%] bottom-12 size-24 rotate-6 max-md:hidden" />
        <Sticker name="spark" className="absolute top-14 right-[14%] size-14 rotate-12 max-md:hidden" />
        <div>
          <p className="text-sm font-bold tracking-wide text-brand-ink uppercase">Ошибка 404</p>
          <h1 className="mt-3 text-[36px] sm:text-[48px] lg:text-[64px] leading-[1.02]">Такой страницы нет</h1>
          <p className="mx-auto mt-4 max-w-[42ch] text-lg text-muted-foreground">
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
