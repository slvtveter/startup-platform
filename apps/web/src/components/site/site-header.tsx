import { Plus } from "lucide-react";
import Link from "next/link";

import { MobileNav } from "@/components/site/mobile-nav";
import { NavLink } from "@/components/site/nav-link";
import { Logo } from "@/components/site/logo";
import { UserMenu } from "@/components/site/user-menu";
import { buttonVariants } from "@/components/ui/button";
import { inboxCount } from "@/lib/api";
import { getMe, serverClient } from "@/lib/server-api";

export async function SiteHeader() {
  const user = await getMe();
  const inbox = user ? (await inboxCount({ client: await serverClient() })).data : undefined;
  // В шапке только каталог; личные разделы — в меню аккаунта (на телефоне — в общем меню).
  const links = [
    { href: "/startups", label: "Стартапы" },
    { href: "/people", label: "Люди" },
  ];
  const mobileLinks = user
    ? [
        ...links,
        { href: "/startups/new", label: "Разместить стартап" },
        { href: "/me/profile", label: "Мой профиль" },
        { href: "/me/applications", label: "Мои отклики", badge: inbox?.mine ?? 0 },
        { href: "/me/startups", label: "Мои стартапы", badge: inbox?.incoming ?? 0 },
      ]
    : [...links, { href: "/login", label: "Войти" }];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:gap-8 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">
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
                Разместить стартап
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
              <Link href="/login" className={buttonVariants({ variant: "ghost", className: "max-sm:hidden" })}>
                Войти
              </Link>
              <Link href="/register" className={buttonVariants()}>
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
