import type { Metadata } from "next";

import { TelegramCallback } from "@/components/auth/telegram-callback";

export const metadata: Metadata = { title: "Вход через Telegram", robots: { index: false } };

export default function TelegramAuthPage() {
  return (
    <div className="mx-auto grid min-h-[50svh] max-w-md place-items-center px-4 text-center">
      <TelegramCallback />
    </div>
  );
}
