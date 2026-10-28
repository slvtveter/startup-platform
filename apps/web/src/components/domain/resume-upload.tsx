"use client";

import { FileText, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteMyResume, uploadMyResume } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

/** Резюме в PDF в редакторе профиля. Файл видят только вошедшие пользователи, не поисковики. */
export function ResumeUpload({
  slug,
  name,
  onChange,
}: {
  slug: string;
  /** Имя загруженного файла; пусто — резюме нет. */
  name: string;
  onChange: (name: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (input.current) input.current.value = "";
    if (file.size > 5 * 1024 * 1024) return toast.error("Файл больше 5 МБ");
    if (file.type && file.type !== "application/pdf") return toast.error("Подойдёт только PDF");
    setBusy(true);
    const { data, error } = await uploadMyResume({ body: { file } });
    setBusy(false);
    if (error) return toast.error(errorMessage(error));
    onChange(data!.resume_name ?? "");
    toast.success("Резюме загружено");
  }

  async function onRemove() {
    const { error } = await deleteMyResume();
    if (error) return toast.error(errorMessage(error));
    onChange("");
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-tone p-4">
      <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-xl bg-white text-brand-ink">
        <FileText className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        {name ? (
          <a href={`/api/people/${slug}/resume`} target="_blank" rel="noopener" className="block truncate font-semibold hover:text-brand-ink">
            {name}
          </a>
        ) : (
          <span className="block font-semibold">Резюме в PDF</span>
        )}
        <span className="block text-sm text-muted-foreground">
          {name ? "Открывается только у вошедших на Envola" : "До 5 МБ. Необязательно, но с ним проще понять твой опыт."}
        </span>
      </div>
      <input
        ref={input}
        id="resume"
        type="file"
        aria-label="Резюме в PDF"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <div className="flex gap-2">
        <Button type="button" variant={name ? "outline" : "default"} size="sm" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? <Loader2 aria-hidden className="animate-spin" /> : <Upload aria-hidden />}
          {name ? "Заменить" : "Загрузить PDF"}
        </Button>
        {name && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            Удалить
          </Button>
        )}
      </div>
    </div>
  );
}
