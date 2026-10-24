"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Меню" />}>
        <MenuIcon />
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
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
