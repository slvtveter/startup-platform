import Link from "next/link";

import { MobileNav } from "@/components/site/mobile-nav";
import { NavLink } from "@/components/site/nav-link";
import { Logo } from "@/components/site/logo";
import { UserMenu } from "@/components/site/user-menu";
import { buttonVariants } from "@/components/ui/button";
import { getMe } from "@/lib/server-api";

export async function SiteHeader() {
  const user = await getMe();
  const links = user
    ? [
        { href: "/startups", label: "Стартапы" },
        { href: "/people", label: "Люди" },
        { href: "/me/applications", label: "Мои заявки" },
        { href: "/me/startups", label: "Мои стартапы" },
      ]
    : [
        { href: "/startups", label: "Стартапы" },
        { href: "/people", label: "Люди" },
      ];

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link href="/startups/new" className={buttonVariants({ variant: "brand", className: "hidden sm:inline-flex" })}>
                Создать стартап
              </Link>
              <UserMenu
                email={user.email}
                name={user.profile?.display_name || user.email.split("@")[0]}
                isAdmin={user.is_admin}
              />
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
                Войти
              </Link>
              <Link href="/register" className={buttonVariants()}>
                Регистрация
              </Link>
            </>
          )}
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
