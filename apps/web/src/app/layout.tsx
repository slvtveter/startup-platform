import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

// next/font скачивает шрифт на этапе сборки и раздаёт его с нашего домена.
const manrope = Manrope({ variable: "--font-sans", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:8080"),
  title: { default: "Startup Platform: первый опыт в IT и команда для стартапа", template: "%s · Startup Platform" },
  description:
    "Стажёры и выпускники находят стартапы для первого реального опыта, а основатели собирают команду: дизайнеров, разработчиков, маркетологов.",
  openGraph: { type: "website", locale: "ru_RU", siteName: "Startup Platform" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
