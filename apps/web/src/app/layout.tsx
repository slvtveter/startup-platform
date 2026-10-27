import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";

import { CookieNotice } from "@/components/site/cookie-notice";
import { HydratedFlag } from "@/components/site/hydrated-flag";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

// next/font скачивает шрифт на этапе сборки и раздаёт его с нашего домена.
// Один шрифт на весь сайт: Manrope и для текста, и для заголовков (800 с плотным трекингом).
const manrope = Manrope({ variable: "--font-sans", subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:8080"),
  title: { default: "Envola: здесь стартапы начинаются с разговора", template: "%s · Envola" },
  description:
    "Место для студентов и начинающих в IT: обсуждай идеи, находи сообщников и сооснователей, собирай команду или вступай в стартап, который уже ищет людей.",
  openGraph: { type: "website", locale: "ru_RU", siteName: "Envola" },
};

// Цвет панели браузера на телефоне — как фон шапки.
export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${manrope.variable} h-full antialiased`}>
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
