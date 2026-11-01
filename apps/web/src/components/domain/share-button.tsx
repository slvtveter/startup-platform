"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * «Поделиться»: на телефоне — системное меню (Telegram, WhatsApp…), иначе ссылка копируется в буфер.
 * Основатели раздают ссылку на стартап по чатам — это главный канал первых откликов.
 */
export function ShareButton({ title, text, path, size = "sm" }: { title: string; text?: string; path: string; size?: "sm" | "lg" }) {
  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return; // человек закрыл меню
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Ссылка скопирована");
    } catch {
      toast.error(`Не удалось скопировать. Ссылка: ${url}`);
    }
  }

  return (
    <Button variant="outline" size={size} onClick={share}>
      <Share2 aria-hidden />
      Поделиться
    </Button>
  );
}
