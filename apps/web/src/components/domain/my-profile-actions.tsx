"use client";

import { Camera, Link2, Loader2, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AvatarUpload } from "@/components/domain/avatar-upload";
import { usePublishWithConsent } from "@/components/domain/publish-consent";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { publishMyProfile } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { goal as reachGoal } from "@/lib/metrika";

/** Кнопка поверх фото и пункт «Фото»: загрузка в окне, без перехода в редактор. */
export function PhotoDialogButton({ name, url, overlay }: { name: string; url: string | null; overlay?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {overlay ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute right-2 bottom-2 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          <Camera aria-hidden className="size-3.5" />
          {url ? "Изменить" : "Добавить фото"}
        </button>
      ) : (
        <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
          <Camera aria-hidden />
          Фото
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Фото профиля</DialogTitle>
          </DialogHeader>
          <AvatarUpload name={name} initialUrl={url} />
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Действия владельца под шапкой своего профиля. */
export function MyProfileActions({ slug, published, canPublish }: { slug: string; published: boolean; canPublish: boolean }) {
  const router = useRouter();
  const { publish, dialog } = usePublishWithConsent();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    if (published) {
      const { error } = await publishMyProfile({ body: { published: false } });
      setBusy(false);
      if (error) return toast.error(errorMessage(error));
      toast.success("Профиль скрыт из каталога");
    } else {
      const r = await publish();
      setBusy(false);
      if (!r.ok) return r.message ? toast.error(r.message) : undefined;
      reachGoal("profile_published");
      toast.success("Профиль опубликован");
    }
    router.refresh();
  }

  async function copy() {
    const url = `${window.location.origin}/people/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Ссылка скопирована");
    } catch {
      toast.message(url);
    }
  }

  return (
    <>
      {dialog}
      <Link href="/me/profile/edit" className={buttonVariants({ variant: "brand", size: "lg" })}>
        <Pencil aria-hidden />
        Редактировать профиль
      </Link>
      {published ? (
        <>
          <Button variant="outline" size="lg" onClick={copy}>
            <Link2 aria-hidden />
            Ссылка
          </Button>
          <Button variant="ghost" size="lg" onClick={toggle} disabled={busy}>
            {busy && <Loader2 aria-hidden className="animate-spin" />}
            Скрыть из каталога
          </Button>
        </>
      ) : (
        canPublish && (
          <Button variant="outline" size="lg" onClick={toggle} disabled={busy}>
            {busy && <Loader2 aria-hidden className="animate-spin" />}
            Опубликовать
          </Button>
        )
      )}
    </>
  );
}
