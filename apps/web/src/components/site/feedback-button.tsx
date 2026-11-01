"use client";

import { ImagePlus, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { sendFeedbackForm } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

/** Открыть окно обратной связи из любого места (пункт меню аватара): window.dispatchEvent(new Event(FEEDBACK_EVENT)). */
export const FEEDBACK_EVENT = "envola:feedback";

/**
 * «Сообщить о проблеме или идее»: текст и необязательный скриншот (файлом или Ctrl+V из буфера).
 * Скриншот уходит на сервер и виден только в админке («Модерация»).
 */
export function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(FEEDBACK_EVENT, show);
    return () => window.removeEventListener(FEEDBACK_EVENT, show);
  }, []);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function pick(f: File | null | undefined) {
    if (input.current) input.current.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Нужна картинка: PNG, JPEG или WebP");
    if (f.size > 5 * 1024 * 1024) return toast.error("Скриншот больше 5 МБ");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    setBusy(true);
    const { error } = await sendFeedbackForm({ body: { text, page_url: pathname, ...(file ? { screenshot: file } : {}) } });
    setBusy(false);
    if (error) return toast.error(errorMessage(error));
    toast.success("Сообщение отправлено, спасибо");
    setText("");
    setFile(null);
    setPreview(null);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-left hover:text-foreground">Сообщить о проблеме или идее</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Сообщить о проблеме</DialogTitle>
          <DialogDescription>Что сломалось или что улучшить? Сообщение придёт команде Envola.</DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => {
            const img = [...e.clipboardData.files].find((f) => f.type.startsWith("image/"));
            if (img) {
              e.preventDefault();
              pick(img);
            }
          }}
          rows={5}
          placeholder="Например: на странице стартапа не нажимается кнопка «Откликнуться»"
        />
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden aria-label="Скриншот" onChange={(e) => pick(e.target.files?.[0])} />
        {preview ? (
          <div className="relative overflow-hidden rounded-xl border">
            {/* Локальный предпросмотр (blob:). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Скриншот" className="max-h-48 w-full object-contain bg-tone" />
            <button
              type="button"
              aria-label="Убрать скриншот"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-white/95 shadow-sm hover:bg-white"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border p-3 text-left text-sm transition-colors hover:border-brand hover:bg-brand-soft/40"
          >
            <ImagePlus aria-hidden className="size-5 shrink-0 text-brand-ink" />
            <span>
              <span className="block font-semibold">Приложить скриншот</span>
              <span className="block text-xs text-muted-foreground">Необязательно. Можно вставить из буфера в поле выше: ⌘V или Ctrl+V</span>
            </span>
          </button>
        )}
        <DialogFooter>
          <Button onClick={submit} disabled={busy || text.trim().length < 3}>
            Отправить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
