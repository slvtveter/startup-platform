"use client";

import Link from "next/link";

import { trackClientEvent } from "@/lib/api";
import { goal } from "@/lib/metrika";

/** Ветка развилки на лендинге: пишет событие landing_path_selected (гипотеза H2) и уводит дальше. */
export function PathLink({
  path,
  href,
  className,
  style,
  children,
}: {
  path: "seeker" | "founder";
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      style={style}
      onClick={() => {
        // Событие не должно задерживать переход: ошибку сети молча игнорируем.
        void trackClientEvent({ body: { name: "landing_path_selected", path } }).catch(() => {});
        goal("landing_path_selected", { path });
      }}
    >
      {children}
    </Link>
  );
}
