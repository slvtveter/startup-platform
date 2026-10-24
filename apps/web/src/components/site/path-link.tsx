"use client";

import Link from "next/link";

import { trackClientEvent } from "@/lib/api";

/** Ветка развилки на лендинге: пишет событие landing_path_selected (гипотеза H2) и уводит дальше. */
export function PathLink({
  path,
  href,
  className,
  children,
}: {
  path: "seeker" | "founder";
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        // Событие не должно задерживать переход: ошибку сети молча игнорируем.
        void trackClientEvent({ body: { name: "landing_path_selected", path } }).catch(() => {});
      }}
    >
      {children}
    </Link>
  );
}
