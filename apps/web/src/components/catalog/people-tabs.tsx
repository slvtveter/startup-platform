import Link from "next/link";

import { cn } from "@/lib/utils";

/** Раздел «Люди» из двух страниц: весь каталог и «Сообщники» — те, кто хочет придумать стартап с нуля. */
export function PeopleTabs({ active, cofounders }: { active: "all" | "cofounders"; cofounders?: number }) {
  const tab = "inline-flex h-11 items-center gap-2 rounded-full px-5 text-base font-bold transition-colors";
  return (
    <nav aria-label="Раздел «Люди»" className="inline-flex rounded-full bg-tone p-1">
      <Link href="/people" aria-current={active === "all" ? "page" : undefined} className={cn(tab, active === "all" ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>
        Все люди
      </Link>
      <Link
        href="/people/cofounders"
        aria-current={active === "cofounders" ? "page" : undefined}
        className={cn(tab, active === "cofounders" ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
      >
        <span aria-hidden className="size-2 rounded-full bg-cornflower" />
        Сообщники
        {cofounders ? <span className="text-sm font-semibold text-muted-foreground">{cofounders}</span> : null}
      </Link>
    </nav>
  );
}
