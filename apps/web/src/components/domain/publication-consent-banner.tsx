"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Sticker } from "@/components/brand/stickers";
import { usePublishWithConsent } from "@/components/domain/publish-consent";
import { Button } from "@/components/ui/button";

/** Профиль уже в каталоге, а согласия на публикацию (ст. 10.1) нет: просим подтвердить, ничего не скрывая. */
export function PublicationConsentBanner() {
  const router = useRouter();
  const { publish, dialog } = usePublishWithConsent();
  return (
    <div className="flex flex-col gap-4 rounded-[24px] bg-brand-soft p-5 sm:flex-row sm:items-center sm:p-6">
      {dialog}
      <Sticker name="check" className="size-12 shrink-0 -rotate-6 max-sm:hidden" />
      <div className="min-w-0 flex-1">
        <h2 className="font-sans text-lg font-bold tracking-normal">Подтверди публикацию профиля</h2>
        <p className="mt-1 text-sm text-muted-foreground">Профиль виден в каталоге. Нужна одна галочка — согласие на публикацию.</p>
      </div>
      <Button
        variant="brand"
        onClick={async () => {
          const r = await publish();
          if (r.ok) {
            toast.success("Готово, профиль остаётся в каталоге");
            router.refresh();
          } else if (r.message) toast.error(r.message);
        }}
      >
        Подтвердить
      </Button>
    </div>
  );
}
