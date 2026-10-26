import type { Metadata } from "next";
import { Golos_Text, Unbounded } from "next/font/google";

import { CookieNotice } from "@/components/site/cookie-notice";
import { HydratedFlag } from "@/components/site/hydrated-flag";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

// next/font скачивает шрифт на этапе сборки и раздаёт его с нашего домена.
const golos = Golos_Text({ variable: "--font-sans", subsets: ["latin", "cyrillic"] });
const unbounded = Unbounded({ variable: "--font-display", subsets: ["latin", "cyrillic"], weight: ["500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:8080"),
  title: { default: "Envola: первый опыт в IT и команда для стартапа", template: "%s · Envola" },
  description:
    "Стажёры и выпускники находят стартапы для первого реального опыта, а основатели собирают команду: дизайнеров, разработчиков, маркетологов.",
  openGraph: { type: "website", locale: "ru_RU", siteName: "Envola" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${golos.variable} ${unbounded.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Для тех, кто ходит клавиатурой: первым Tab — сразу к содержимому, мимо меню. */}
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-foreground px-4 py-2 font-semibold text-background focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Перейти к содержимому
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <SiteFooter />
        <CookieNotice />
        <HydratedFlag />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
