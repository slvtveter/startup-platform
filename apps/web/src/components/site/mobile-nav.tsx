"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Меню гостя на телефоне: только разделы сайта и внизу вход. У вошедших вместо него нижняя
 * панель разделов (MobileTabBar) и меню аватара — так личные пункты не повторяются в двух местах.
 */
export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Меню" />}>
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="right" className="flex w-[min(20rem,88vw)] flex-col gap-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="text-sm font-semibold text-muted-foreground">Меню</SheetTitle>
        </SheetHeader>
        <nav aria-label="Разделы" className="flex-1 px-3">
          <ul>
            {links.map((l) => {
              const [path] = l.href.split("?");
              const active = pathname === path && !l.href.includes("?");
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center rounded-xl px-3 text-lg font-bold tracking-[-0.02em] transition-colors hover:bg-tone",
                      active && "text-brand-ink",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="grid gap-2 border-t px-6 pt-4 pb-[max(env(safe-area-inset-bottom),24px)]">
          <Link href="/register" onClick={() => setOpen(false)} className={buttonVariants({ size: "lg", className: "w-full" })}>
            Регистрация
          </Link>
          <Link href="/login" onClick={() => setOpen(false)} className={buttonVariants({ variant: "outline", size: "lg", className: "w-full" })}>
            Войти
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
