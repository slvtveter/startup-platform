"use client";

import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { startChat } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { goal } from "@/lib/metrika";

/**
 * «Написать» с профиля или «Обсудить идею» со страницы стартапа: первое сообщение любому человеку,
 * дальше — в разделе «Сообщения». Черновик можно подставить заранее, человек его поправит.
 */
export function WriteDialog({
  slug,
  name,
  label = "Написать",
  draft = "",
  variant = "outline",
  className = "w-full",
}: {
  slug: string;
  name: string;
  label?: string;
  draft?: string;
  variant?: "outline" | "default";
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(draft);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const { data, error } = await startChat({ body: { slug, body } });
    setBusy(false);
    if (error) return toast.error(errorMessage(error));
    goal("chat_started");
    router.push(`/chats/${data!.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={variant} size="lg" className={className} />}>
        <MessageCircle aria-hidden className="size-4" />
        {label}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Сообщение: {name}</DialogTitle>
          <DialogDescription>Расскажи коротко, кто ты и что хочешь предложить. Ответ придёт в «Сообщения».</DialogDescription>
        </DialogHeader>
        {/* Готовые первые сообщения: первый шаг — самый трудный, пусть он будет в один клик. */}
        <div className="flex flex-wrap gap-1.5" aria-label="Готовые начала">
          {[
            `Привет! Посмотрел(а) твой профиль — хочу предложить вместе придумать проект. Созвонимся на 20 минут?`,
            `Привет! У меня есть идея, и кажется, твои навыки там очень нужны. Расскажу в двух словах?`,
            `Привет! Мы делаем похожие вещи — было бы интересно познакомиться и обменяться опытом.`,
          ].map((t, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setBody(t)}
              className="rounded-full bg-tone px-3 py-1.5 text-left text-xs font-semibold transition-colors hover:bg-tone-2"
            >
              {["Придумать проект вместе", "Есть идея", "Познакомиться"][i]}
            </button>
          ))}
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          maxLength={4000}
          aria-label="Сообщение"
          placeholder="Напиши пару фраз о себе и о том, что хочешь предложить"
        />
        <DialogFooter>
          <Button disabled={!body.trim() || busy} onClick={submit}>
            Отправить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
