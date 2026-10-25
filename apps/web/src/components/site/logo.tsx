import Link from "next/link";

/** Знак — ряд мест в команде: два заняты, третье ждёт человека. */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`inline-flex gap-[3px] ${className}`}>
      <span className="size-2.5 rounded-[3px] bg-foreground" />
      <span className="size-2.5 rounded-[3px] bg-foreground" />
      <span className="size-2.5 rounded-[3px] border-[1.5px] border-dashed border-foreground bg-marker" />
    </span>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 font-heading text-[13px] font-semibold tracking-tight sm:gap-2.5 sm:text-[15px]">
      <LogoMark />
      envola
    </Link>
  );
}
