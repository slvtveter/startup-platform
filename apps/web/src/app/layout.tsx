import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";

import { CookieNotice } from "@/components/site/cookie-notice";
import { HydratedFlag } from "@/components/site/hydrated-flag";
import { Metrika } from "@/components/site/metrika";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { TermsGate } from "@/components/site/terms-gate";
import { Toaster } from "@/components/ui/sonner";
import { getMe } from "@/lib/server-api";

import "./globals.css";

// next/font скачивает шрифт на этапе сборки и раздаёт его с нашего домена.
// Один шрифт на весь сайт: Manrope и для текста, и для заголовков (800 с плотным трекингом).
const manrope = Manrope({ variable: "--font-sans", subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:8080"),
  // В заголовке — то, что ищут: «команда для стартапа», «стартап для студентов», «сооснователь».
  title: { default: "Envola: команда для стартапа и проекты для студентов в IT", template: "%s · Envola" },
  description:
    "Стартапы и идеи, которым нужны разработчики, дизайнеры и маркетологи. Найди проект для первого опыта, команду под свою идею или сооснователя. Можно без опыта.",
  openGraph: { type: "website", locale: "ru_RU", siteName: "Envola" },
  // Коды из Яндекс Вебмастера и Search Console задаются на сервере (infra/.env.prod), пусто — тега нет.
  verification: {
    yandex: process.env.YANDEX_VERIFICATION || undefined,
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
};

// Цвет панели браузера на телефоне — как фон шапки.
export const viewport: Viewport = { themeColor: "#ffffff" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Тот же запрос, что в шапке (getMe кешируется на время рендера).
  const user = await getMe();
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
          <TermsGate needed={!!user?.needs_terms}>{children}</TermsGate>
        </main>
        <SiteFooter />
        <CookieNotice />
        <HydratedFlag />
        <Metrika />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
