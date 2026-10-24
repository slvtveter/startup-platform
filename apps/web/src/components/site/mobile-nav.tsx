"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { InboxBadge } from "@/components/site/inbox-badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function MobileNav({ links }: { links: { href: string; label: string; badge?: number }[] }) {
  const [open, setOpen] = useState(false);
  const unread = links.reduce((n, l) => n + (l.badge ?? 0), 0);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="relative md:hidden" aria-label={unread ? `Меню, новых: ${unread}` : "Меню"} />}>
        <MenuIcon />
        {unread > 0 && <span aria-hidden className="absolute top-1 right-1 size-2 rounded-full bg-brand" />}
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Меню</SheetTitle>
        </SheetHeader>
        <nav className="grid gap-1 px-4">
          {[...links, { href: "/startups/new", label: "Создать стартап" }].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-[15px] font-semibold hover:bg-muted"
            >
              {l.label}
              <InboxBadge count={l.badge ?? 0} />
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
