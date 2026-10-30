"use client";

import { UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { initialsOf } from "@/components/domain/seats";
import { Button } from "@/components/ui/button";
import { deleteMyAvatar, uploadMyAvatar } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

/** Аватар в редакторе профиля (KAN-34). Без фото показываем место с инициалами. */
export function AvatarUpload({
  name,
  initialUrl,
  onChange,
}: {
  name: string;
  initialUrl: string | null;
  /** Фото появилось или удалено: редактор пересчитывает заполненность. */
  onChange?: (url: string | null) => void;
}) {
  const router = useRouter();
  const [url, setUrlState] = useState(initialUrl);
  const setUrl = (v: string | null) => {
    setUrlState(v);
    onChange?.(v);
    // Аватар в шапке рисует сервер: обновляем его сразу, без перезагрузки страницы.
    router.refresh();
  };
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
      <Avatar name={name} url={url} className="size-20 rounded-full text-2xl" />
      <div className="flex flex-wrap gap-2">
        <input
          ref={input}
          id="avatar"
          type="file"
          aria-label="Фото профиля"
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
  if (!url && !name.trim())
    // Имя ещё не заполнено: силуэт вместо безликой точки.
    return (
      <span aria-hidden className={`inline-flex shrink-0 items-center justify-center bg-brand-soft text-brand-ink ${className ?? ""}`}>
        <UserRound className="size-1/2" />
      </span>
    );
  if (!url)
    return (
      <span aria-hidden className={`inline-flex shrink-0 items-center justify-center bg-brand-soft font-extrabold text-brand-ink ${className ?? ""}`}>
        {initialsOf(name)}
      </span>
    );
  // eslint-disable-next-line @next/next/no-img-element -- файлы уже нужного размера, оптимизатор Next не нужен
  return <img src={url} alt="" width={80} height={80} className={`shrink-0 object-cover ${className ?? ""}`} />;
}
