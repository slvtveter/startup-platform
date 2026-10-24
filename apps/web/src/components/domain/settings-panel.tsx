"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword, deleteAccount, resendVerification } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

export function SettingsPanel({ email, verified }: { email: string; verified: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await changePassword({ body: { current_password: current, new_password: next } });
    if (error) return toast.error(errorMessage(error));
    toast.success("Пароль изменён");
    setCurrent("");
    setNext("");
  }

  async function onResend() {
    const { error } = await resendVerification();
    if (error) return toast.error(errorMessage(error));
    toast.success("Письмо отправлено ещё раз");
  }

  async function onDelete() {
    const { error } = await deleteAccount();
    if (error) return toast.error(errorMessage(error));
    router.push("/");
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-extrabold">Почта</h2>
        <p className="mt-1 text-muted-foreground">{email}</p>
        {verified ? (
          <p className="mt-3 text-sm font-bold text-success-ink">Подтверждена</p>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-warn-ink">Не подтверждена</span>
            <Button variant="outline" size="sm" onClick={onResend}>
              Отправить письмо ещё раз
            </Button>
          </div>
        )}
      </section>

      <form onSubmit={onChangePassword} className="grid gap-4 rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-extrabold">Смена пароля</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="cur">Текущий пароль</Label>
            <Input id="cur" type="password" required className="mt-1.5 h-11" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="new">Новый пароль</Label>
            <Input id="new" type="password" minLength={8} required className="mt-1.5 h-11" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
        </div>
        <Button type="submit" className="w-fit">
          Сменить пароль
        </Button>
      </form>

      <section className="rounded-2xl border border-destructive/30 bg-card p-6">
        <h2 className="text-lg font-extrabold">Удаление аккаунта</h2>
        <p className="mt-1 text-sm text-muted-foreground">Профиль, стартапы и отклики будут удалены без возможности восстановления.</p>
        <Dialog>
          <DialogTrigger render={<Button variant="destructive" className="mt-4" />}>Удалить аккаунт</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Удалить аккаунт навсегда?</DialogTitle>
              <DialogDescription>Чтобы подтвердить, введи свой email.</DialogDescription>
            </DialogHeader>
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={email} />
            <DialogFooter>
              <Button variant="destructive" disabled={confirm.trim().toLowerCase() !== email} onClick={onDelete}>
                Удалить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
