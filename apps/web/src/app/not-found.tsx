import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Страница не найдена", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-xl place-items-center px-4 py-24 text-center">
      <div className="text-7xl font-bold text-brand">404</div>
      <h1 className="mt-4 text-3xl">Такой страницы нет</h1>
      <p className="mt-2 text-muted-foreground">Возможно, стартап закрыли или профиль скрыли из каталога.</p>
      <div className="mt-8 flex gap-2">
        <Link href="/startups" className={buttonVariants()}>
          К стартапам
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          На главную
        </Link>
      </div>
    </div>
  );
}
