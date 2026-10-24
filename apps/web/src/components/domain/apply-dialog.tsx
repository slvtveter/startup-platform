"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { applyToRole, resendVerification, trackClientEvent, updateMyProfile, type ProfileUpdate } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

export type ApplyState = "guest" | "unverified" | "incomplete" | "can_apply" | "applied";

type Props = {
  roleId: string;
  roleTitle: string;
  startupTitle: string;
  state: ApplyState;
  /** Чего не хватает в профиле для отклика (из apply_blockers API). */
  needs?: { name: boolean; role: boolean; proof: boolean };
  roles?: { slug: string; name: string }[];
  primary?: boolean;
};

const MIN_MESSAGE = 30;

export function ApplyDialog({ roleId, roleTitle, startupTitle, state, needs, roles = [], primary }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // После входа гость возвращается с ?apply=<roleId>, и диалог открывается сам.
  const [open, setOpen] = useState(params.get("apply") === roleId && state !== "guest" && state !== "applied");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const variant = primary ? "brand" : "outline";

  if (state === "applied")
    return (
      <Link href="/me/applications" className={buttonVariants({ variant: "secondary" })}>
        Отклик отправлен
      </Link>
    );
  if (state === "guest") {
    const next = `${pathname}?apply=${roleId}`;
    return (
      <Link href={`/login?next=${encodeURIComponent(next)}`} className={buttonVariants({ variant })}>
        Войти и откликнуться
      </Link>
    );
  }

  const profileReady =
    state !== "incomplete" ||
    ((!needs?.name || name.trim().length >= 2) && (!needs?.role || !!role) && (!needs?.proof || /^https?:\/\/\S+\.\S+/.test(link.trim())));

  async function submit() {
    setBusy(true);
    if (state === "incomplete") {
      const body: ProfileUpdate = {};
      if (needs?.name) body.display_name = name.trim();
      if (needs?.role) body.primary_role = role;
      if (needs?.proof) body.links = [{ kind: "portfolio", url: link.trim() }];
      const { error } = await updateMyProfile({ body });
      if (error) {
        setBusy(false);
        return toast.error(errorMessage(error));
      }
    }
    const { error } = await applyToRole({ path: { role_id: roleId }, body: { message } });
    setBusy(false);
    if (error) return toast.error(errorMessage(error));
    toast.success("Отклик отправлен. Мы пришлём письмо, когда основатель ответит.");
    setOpen(false);
    router.push("/me/applications");
    router.refresh();
  }

  async function resend() {
    const { error } = await resendVerification();
    if (error) return toast.error(errorMessage(error));
    toast.success("Письмо отправлено ещё раз");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) void trackClientEvent({ body: { name: "apply_started" } }).catch(() => {});
        setOpen(next);
      }}
    >
      <DialogTrigger render={<Button variant={variant} />}>Откликнуться</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {roleTitle} в {startupTitle}
          </DialogTitle>
          <DialogDescription>
            Основатель увидит твой профиль и это сообщение. Контакты откроются обеим сторонам, только если отклик примут.
          </DialogDescription>
        </DialogHeader>
        {state === "unverified" ? (
          <div className="rounded-xl bg-warn-soft p-4 text-sm text-warn-ink">
            Подтверди почту: мы отправили письмо со ссылкой. После подтверждения вернись на эту страницу.{" "}
            <button type="button" onClick={resend} className="font-bold underline">
              Отправить ещё раз
            </button>
          </div>
        ) : (
          <>
            {state === "incomplete" && needs && (
              <div className="grid gap-3 rounded-xl bg-secondary p-4">
                <p className="text-sm text-muted-foreground">
                  Пара полей для основателя. Остальной профиль можно заполнить потом.
                </p>
                {needs.name && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="apply-name">Как тебя зовут</Label>
                    <Input id="apply-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Мария Ким" />
                  </div>
                )}
                {needs.role && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="apply-role">Твоя основная роль</Label>
                    <select
                      id="apply-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="h-10 rounded-lg border bg-card px-3 text-sm"
                    >
                      <option value="">Выбери роль</option>
                      {roles.map((r) => (
                        <option key={r.slug} value={r.slug}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {needs.proof && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="apply-link">Ссылка на работу</Label>
                    <Input
                      id="apply-link"
                      type="url"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="GitHub, Behance, учебный проект или резюме"
                    />
                  </div>
                )}
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="apply-message">Сообщение основателю</Label>
              <Textarea
                id="apply-message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Почему тебе интересна эта роль, что ты уже делал похожего и сколько часов в неделю готов уделять."
              />
              <div className="text-right text-xs text-muted-foreground">
                {message.length} / 1000, минимум {MIN_MESSAGE}
              </div>
            </div>
            <DialogFooter>
              <Button variant="brand" onClick={submit} disabled={busy || !profileReady || message.trim().length < MIN_MESSAGE}>
                Отправить отклик
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
