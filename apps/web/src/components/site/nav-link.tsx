"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "text-[15px] font-semibold text-muted-foreground transition-colors hover:text-foreground",
        active && "text-foreground underline decoration-brand decoration-2 underline-offset-[22px]",
      )}
    >
      {children}
    </Link>
  );
}
