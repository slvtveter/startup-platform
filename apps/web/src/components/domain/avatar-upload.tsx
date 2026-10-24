"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { initialsOf, Seat } from "@/components/domain/seats";
import { Button } from "@/components/ui/button";
import { deleteMyAvatar, uploadMyAvatar } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

/** Аватар в редакторе профиля (KAN-34). Без фото показываем место с инициалами. */
export function AvatarUpload({ name, initialUrl }: { name: string; initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Файл больше 5 МБ");
    setBusy(true);
    const { data, error } = await uploadMyAvatar({ body: { file } });
    setBusy(false);
    if (input.current) input.current.value = "";
    if (error) return toast.error(errorMessage(error));
    setUrl(data!.avatar_url ?? null);
    toast.success("Фото обновлено");
  }

  async function onRemove() {
    const { error } = await deleteMyAvatar();
    if (error) return toast.error(errorMessage(error));
    setUrl(null);
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} url={url} className="size-20 rounded-2xl text-2xl" />
      <div className="flex flex-wrap gap-2">
        <input
          ref={input}
          id="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
          {url ? "Заменить фото" : "Загрузить фото"}
        </Button>
        {url && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            Удалить
          </Button>
        )}
        <p className="w-full text-xs text-muted-foreground">JPEG, PNG или WebP до 5 МБ. Фото не обязательно.</p>
      </div>
    </div>
  );
}

/** Фото, если есть, иначе занятое место с инициалами. */
export function Avatar({ name, url, className }: { name: string; url: string | null | undefined; className?: string }) {
  if (!url) return <Seat filled initials={initialsOf(name)} className={className} />;
  // eslint-disable-next-line @next/next/no-img-element -- файлы уже нужного размера, оптимизатор Next не нужен
  return <img src={url} alt="" width={80} height={80} className={`shrink-0 object-cover ${className ?? ""}`} />;
}
