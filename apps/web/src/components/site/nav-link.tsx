"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  // «Идеи» — это каталог стартапов с фильтром стадии, поэтому сравниваем только путь без query.
  const path = href.split("?")[0];
  const active = !href.includes("?") && (pathname === path || pathname.startsWith(path + "/"));
  return (
    <Link
      href={href}
      className={cn(
        "text-[15px] font-semibold text-muted-foreground transition-colors hover:text-foreground",
        active && "text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
