"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/** Пункт шапки: горит на своём разделе и его страницах (/people/cofounders — это «Люди»). */
export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
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
