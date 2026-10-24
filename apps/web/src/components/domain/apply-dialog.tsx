"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
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
import { applyToRole } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

type Props = {
  roleId: string;
  roleTitle: string;
  startupTitle: string;
  state: "guest" | "not_ready" | "can_apply" | "applied";
  primary?: boolean;
};

export function ApplyDialog({ roleId, roleTitle, startupTitle, state, primary }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const variant = primary ? "brand" : "outline";

  if (state === "applied")
    return (
      <Link href="/me/applications" className={buttonVariants({ variant: "secondary", className: "w-full" })}>
        Отклик отправлен
      </Link>
    );
  if (state === "guest")
    return (
      <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={buttonVariants({ variant, className: "w-full" })}>
        Войти и откликнуться
      </Link>
    );

  async function submit() {
    setBusy(true);
    const { error } = await applyToRole({ path: { role_id: roleId }, body: { message } });
    setBusy(false);
    if (error) return toast.error(errorMessage(error));
    toast.success("Отклик отправлен. Основатели обычно отвечают в течение 72 часов.");
    setOpen(false);
    router.push("/me/applications");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={variant} className="w-full" />}>Откликнуться</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {roleTitle} в {startupTitle}
          </DialogTitle>
          <DialogDescription>
            Основатель увидит твой профиль и это сообщение. Контакты откроются обеим сторонам, только если отклик примут.
          </DialogDescription>
        </DialogHeader>
        {state === "not_ready" ? (
          <div className="rounded-xl bg-warn-soft p-4 text-sm text-warn-ink">
            Чтобы откликаться, подтверди email и опубликуй профиль.{" "}
            <Link href="/me/profile" className="font-bold underline">
              Перейти к профилю
            </Link>
          </div>
        ) : (
          <>
            <Textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Расскажи, почему тебе интересен проект и что ты уже делал. Ссылка на работу сильно повышает шансы."
            />
            <div className="text-right text-xs text-muted-foreground">{message.length} / 1000, минимум 30</div>
            <DialogFooter>
              <Button variant="brand" onClick={submit} disabled={busy || message.trim().length < 30}>
                Отправить отклик
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
