"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * Пункт шапки. «Идеи» и «Стартапы» — один каталог с разным фильтром стадии, поэтому для /startups
 * смотрим и на ?stage: только идеи — горит «Идеи», иначе — «Стартапы».
 */
function ActiveLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [path, query] = href.split("?");
  const onPath = path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");
  const ideasOnly = params.getAll("stage").join() === "idea";
  const active = path === "/startups" && pathname === "/startups" ? (query === "stage=idea") === ideasOnly : onPath;
  return <Item href={href} active={active}>{children}</Item>;
}

function Item({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative py-2 text-[15px] font-semibold text-muted-foreground transition-colors hover:text-foreground",
        active && "text-foreground after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-cornflower",
      )}
    >
      {children}
    </Link>
  );
}

// useSearchParams на статических страницах требует Suspense: до гидрации пункт рисуется без подсветки.
export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Suspense fallback={<Item href={href} active={false}>{children}</Item>}>
      <ActiveLink href={href}>{children}</ActiveLink>
    </Suspense>
  );
}
