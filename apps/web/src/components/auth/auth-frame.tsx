"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Tab = "login" | "register";
const TAB_OF: Record<string, Tab> = { "/login": "login", "/register": "register" };

/**
 * Карточка входа живёт в layout раздела и не пересоздаётся при переходе «Вход ⇄ Регистрация»:
 * плашка вкладок переезжает, высота карточки плавно подстраивается под новую форму,
 * а содержимое проявляется. При первой загрузке ничего не анимируется.
 */
export function AuthFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  // Анимация только после перехода внутри раздела, не при первой загрузке.
  const [prevPath, setPrevPath] = useState(pathname);
  const [navigated, setNavigated] = useState(false);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setNavigated(true);
  }

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tab = TAB_OF[pathname];
  return (
    <div
      style={{ height }}
      className="w-full overflow-hidden rounded-[28px] bg-card shadow-[0_24px_60px_-30px_rgb(15_27_45/0.25)] transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
    >
      <div ref={inner} className="p-6 sm:p-9">
        {tab && (
          <Suspense fallback={<AuthTabs active={tab} />}>
            <AuthTabsWithNext active={tab} />
          </Suspense>
        )}
        <div key={pathname} className={cn(navigated && "animate-[enter-up_380ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none")}>
          {children}
        </div>
      </div>
    </div>
  );
}

function AuthTabsWithNext({ active }: { active: Tab }) {
  const next = useSearchParams().get("next") ?? undefined;
  return <AuthTabs active={active} next={next} />;
}

function AuthTabs({ active, next }: { active: Tab; next?: string }) {
  // Плашка переезжает сразу по клику, не дожидаясь, пока загрузится соседняя страница.
  const [current, setCurrent] = useState(active);
  const [prevActive, setPrevActive] = useState(active);
  if (prevActive !== active) {
    setPrevActive(active);
    setCurrent(active);
  }
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  const tabs = [
    { key: "login", href: `/login${q}`, label: "Вход" },
    { key: "register", href: `/register${q}`, label: "Регистрация" },
  ] as const;
  return (
    <nav aria-label="Вход или регистрация" className="relative mb-8 grid grid-cols-2 rounded-full bg-tone p-1">
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-white shadow-[0_1px_3px_rgb(15_27_45/0.12)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          current === "register" && "translate-x-full",
        )}
      />
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          replace
          scroll={false}
          onClick={() => setCurrent(t.key)}
          aria-current={t.key === active ? "page" : undefined}
          className={cn(
            "relative rounded-full py-2.5 text-center text-sm transition-colors duration-300",
            t.key === current ? "font-bold text-foreground" : "font-semibold text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
