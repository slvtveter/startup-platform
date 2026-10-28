import { MessageCircle, Plus } from "lucide-react";
import Link from "next/link";

import { MobileNav } from "@/components/site/mobile-nav";
import { NavLink } from "@/components/site/nav-link";
import { Logo } from "@/components/site/logo";
import { UserMenu } from "@/components/site/user-menu";
import { buttonVariants } from "@/components/ui/button";
import { inboxCount, unreadChats } from "@/lib/api";
import { getMe, serverClient } from "@/lib/server-api";

export async function SiteHeader() {
  const user = await getMe();
  const client = user ? await serverClient() : undefined;
  const [inbox, chats] = user
    ? await Promise.all([inboxCount({ client }).then((r) => r.data), unreadChats({ client }).then((r) => r.data)])
    : [undefined, undefined];
  // В шапке только каталог; личные разделы — в меню аккаунта (на телефоне — в общем меню).
  // «Главная» — для вошедших это дашборд с моими стартапами и откликами (KAN-138 п.2): всегда видно, как вернуться.
  const links = [
    ...(user ? [{ href: "/", label: "Главная" }] : []),
    { href: "/ideas", label: "Идеи" },
    { href: "/startups", label: "Стартапы" },
    { href: "/people", label: "Люди" },
  ];
  const mobileLinks = user
    ? [
        ...links,
        { href: "/startups/new", label: "Предложить идею" },
        { href: "/chats", label: "Сообщения", badge: chats?.count ?? 0 },
        { href: "/me/profile", label: "Мой профиль" },
        { href: "/me/applications", label: "Мои отклики", badge: inbox?.mine ?? 0 },
        { href: "/me/startups", label: "Мои стартапы", badge: inbox?.incoming ?? 0 },
        { href: "/me/settings", label: "Настройки" },
      ]
    : [...links, { href: "/login", label: "Войти" }, { href: "/register", label: "Регистрация" }];

  return (
    <header className="sticky top-0 z-40 bg-background shadow-[0_1px_0_var(--border)]">
      <div className="mx-auto flex h-[72px] w-full max-w-[1360px] items-center gap-4 px-4 sm:gap-8 sm:px-6 lg:px-10">
        <Logo />
        <nav aria-label="Основное" className="hidden items-center gap-6 lg:flex xl:gap-7">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <Link href="/startups/new" className={buttonVariants({ variant: "ghost", className: "max-sm:hidden" })}>
                <Plus aria-hidden className="size-4" />
                Предложить идею
              </Link>
              <Link
                href="/chats"
                className="relative grid size-10 place-items-center rounded-full transition-colors hover:bg-secondary"
                aria-label={chats?.count ? `Сообщения, непрочитанных диалогов: ${chats.count}` : "Сообщения"}
              >
                <MessageCircle aria-hidden className="size-5" />
                {chats?.count ? (
                  <span className="absolute top-1 right-0.5 min-w-4 rounded-full bg-brand px-1 text-center text-[10px] leading-4 font-semibold text-white">
                    {chats.count}
                  </span>
                ) : null}
              </Link>
              <UserMenu
                email={user.email}
                name={user.profile?.display_name || user.email.split("@")[0]}
                isAdmin={user.is_admin}
                inbox={{ mine: inbox?.mine ?? 0, incoming: inbox?.incoming ?? 0 }}
              />
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", className: "h-10 max-sm:hidden" })}>
                Войти
              </Link>
              <Link href="/register" className={buttonVariants({ size: "sm", className: "sm:h-10 sm:px-4 sm:text-[15px]" })}>
                Регистрация
              </Link>
            </>
          )}
          <MobileNav links={mobileLinks} />
        </div>
      </div>
    </header>
  );
}
