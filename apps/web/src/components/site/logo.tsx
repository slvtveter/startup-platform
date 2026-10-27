import Link from "next/link";

/**
 * Знак Envola: залитый васильковый круг, в нём «e», точка которой отделилась и уходит вверх вправо —
 * разговор, из которого что-то начинается (design/logo, выбран 2026-10-27).
 */
export function LogoMark({ className = "size-[26px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={`shrink-0 ${className}`}>
      <circle cx="32" cy="32" r="29" fill="var(--cornflower)" />
      <path d="M17 33 H45 A14 14 0 1 0 40.7 43.2" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
      <circle cx="47.5" cy="17.5" r="4.6" fill="#fff" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.32em] text-[22px] leading-none font-extrabold tracking-[-0.045em] ${className}`}>
      <LogoMark className="size-[1.18em]" />
      envola
    </span>
  );
}

export function Logo() {
  return (
    <Link href="/" aria-label="Envola, на главную" className="flex shrink-0 items-center rounded-lg">
      <Wordmark className="text-[20px] sm:text-[22px]" />
    </Link>
  );
}
