"use client";

import { ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { StartupCover } from "@/components/domain/startup-card";
import { Button } from "@/components/ui/button";
import { deleteStartupCover, uploadStartupCover, type StartupDetail } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

/** Обложка стартапа: видна в каталоге, на главной и в шапке страницы проекта. */
export function CoverUpload({ startup }: { startup: StartupDetail }) {
  const [s, setS] = useState(startup);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Файл больше 5 МБ");
    setBusy(true);
    const { data, error } = await uploadStartupCover({ path: { startup_id: s.id }, body: { file } });
    setBusy(false);
    if (input.current) input.current.value = "";
    if (error) return toast.error(errorMessage(error));
    setS(data!);
    toast.success("Обложка обновлена");
  }

  async function onRemove() {
    const { data, error } = await deleteStartupCover({ path: { startup_id: s.id } });
    if (error) return toast.error(errorMessage(error));
    setS(data!);
  }

  return (
    <section className="grid gap-5 rounded-[26px] bg-tone p-5 sm:grid-cols-[260px_minmax(0,1fr)] sm:items-center sm:p-6">
      <div className="relative aspect-[16/9] overflow-hidden rounded-[18px] bg-tone-2">
        <StartupCover startup={s} sizes="260px" />
      </div>
      <div>
        <h2 className="text-lg font-extrabold tracking-[-0.02em]">Обложка</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Фото продукта, команды или того, для кого вы его делаете. Горизонтальное, JPEG, PNG или WebP до 5 МБ. Без обложки покажем первую букву названия.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
            <ImagePlus aria-hidden />
            {s.cover_url ? "Заменить" : "Загрузить обложку"}
          </Button>
          {s.cover_url && (
            <Button type="button" variant="ghost" disabled={busy} onClick={onRemove}>
              Убрать
            </Button>
          )}
        </div>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
    </section>
  );
}
