"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { sendFeedback } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

export function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const { error } = await sendFeedback({ body: { text, page_url: pathname } });
    setBusy(false);
    if (error) return toast.error(errorMessage(error));
    toast.success("Спасибо! Мы прочитаем каждое сообщение.");
    setText("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-left hover:text-foreground">Сообщить о проблеме или идее</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Обратная связь</DialogTitle>
          <DialogDescription>Нашли баг или есть идея? Напишите, это сразу увидит команда.</DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Например: на странице стартапа не работает кнопка..."
        />
        <DialogFooter>
          <Button onClick={submit} disabled={busy || text.trim().length < 3}>
            Отправить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
