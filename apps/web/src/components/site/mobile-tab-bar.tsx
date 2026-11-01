"use client";

import { Home, MessageCircle, Rocket, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type Tab = { href: string; label: string; icon: LucideIcon; badge?: number };

/**
 * Нижняя панель разделов на телефоне для вошедших — как в приложениях hh и Telegram:
 * четыре раздела всегда под пальцем, вместо бургер-меню. Личное (профиль, отклики, настройки) —
 * в меню аватара в шапке. В открытом диалоге панель прячется (globals.css), там своё поле ввода.
 */
export function MobileTabBar({ chats }: { chats: number }) {
  const pathname = usePathname();
  const tabs: Tab[] = [
    { href: "/", label: "Главная", icon: Home },
    { href: "/startups", label: "Стартапы", icon: Rocket },
    { href: "/people", label: "Люди", icon: Users },
    { href: "/chats", label: "Сообщения", icon: MessageCircle, badge: chats },
  ];
  return (
    <nav
      aria-label="Разделы"
      className="tabbar fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
        {tabs.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors",
                  active ? "text-brand-ink" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative">
                  <t.icon aria-hidden className="size-[22px]" strokeWidth={active ? 2.4 : 2} />
                  {t.badge ? (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[18px] rounded-full bg-brand px-1 text-center text-xs leading-[18px] font-bold text-white">
                      {t.badge > 99 ? "99+" : t.badge}
                    </span>
                  ) : null}
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
