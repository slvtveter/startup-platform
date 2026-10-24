"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeEmail, changePassword, deleteAccount, resendVerification } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

export function SettingsPanel({ email, verified }: { email: string; verified: boolean }) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  async function onChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await changeEmail({ body: { new_email: newEmail, password: emailPassword } });
    if (error) return toast.error(errorMessage(error));
    setPendingEmail(newEmail.trim().toLowerCase());
    setNewEmail("");
    setEmailPassword("");
  }

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
        <h2 className="text-lg">Почта</h2>
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
        {pendingEmail ? (
          <p className="mt-4 rounded-xl bg-secondary p-3 text-sm">
            Мы отправили ссылку на {pendingEmail}. Пока вы по ней не перейдёте, вход работает по текущему адресу.
          </p>
        ) : (
          <form onSubmit={onChangeEmail} className="mt-5 grid gap-4 border-t pt-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="new-email">Новый адрес</Label>
              <Input id="new-email" type="email" required className="mt-1.5 h-11" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email-password">Пароль</Label>
              <Input id="email-password" type="password" required className="mt-1.5 h-11" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} />
            </div>
            <Button type="submit" variant="outline" className="w-fit">
              Сменить почту
            </Button>
          </form>
        )}
      </section>

      <form onSubmit={onChangePassword} className="grid gap-4 rounded-2xl border bg-card p-6">
        <h2 className="text-lg">Смена пароля</h2>
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
        <h2 className="text-lg">Удаление аккаунта</h2>
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
