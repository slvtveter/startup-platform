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
  // Формы смены почты и пароля нужны редко: раскрываются по кнопке, а не висят открытыми.
  const [editing, setEditing] = useState<"email" | "password" | null>(null);

  async function onChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await changeEmail({ body: { new_email: newEmail, password: emailPassword } });
    if (error) return toast.error(errorMessage(error));
    setPendingEmail(newEmail.trim().toLowerCase());
    setNewEmail("");
    setEmailPassword("");
    setEditing(null);
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await changePassword({ body: { current_password: current, new_password: next } });
    if (error) return toast.error(errorMessage(error));
    toast.success("Пароль изменён");
    setCurrent("");
    setNext("");
    setEditing(null);
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
        <h2 className="font-sans text-lg font-bold tracking-normal">Вход в аккаунт</h2>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4">
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">Почта</div>
            <div className="truncate font-medium">{email}</div>
          </div>
          {verified ? (
            <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success-ink">Подтверждена</span>
          ) : (
            <Button variant="outline" size="sm" onClick={onResend}>
              Подтвердить почту
            </Button>
          )}
          {!pendingEmail && editing !== "email" && (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setEditing("email")}>
              Изменить
            </Button>
          )}
        </div>
        {pendingEmail && (
          <p className="mt-4 rounded-xl bg-secondary p-3 text-sm">
            Мы отправили ссылку на {pendingEmail}. Пока вы по ней не перейдёте, вход работает по текущему адресу.
          </p>
        )}
        {editing === "email" && (
          <form onSubmit={onChangeEmail} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="new-email">Новый адрес</Label>
              <Input id="new-email" type="email" required autoFocus className="mt-1.5 h-11" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email-password">Текущий пароль</Label>
              <Input id="email-password" type="password" required className="mt-1.5 h-11" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Сменить почту</Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Отмена
              </Button>
            </div>
          </form>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4">
          <div>
            <div className="text-sm text-muted-foreground">Пароль</div>
            <div className="font-medium tracking-widest">••••••••</div>
          </div>
          {editing !== "password" && (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setEditing("password")}>
              Изменить
            </Button>
          )}
        </div>
        {editing === "password" && (
          <form onSubmit={onChangePassword} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cur">Текущий пароль</Label>
              <Input id="cur" type="password" required autoFocus className="mt-1.5 h-11" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="new">Новый пароль</Label>
              <Input id="new" type="password" minLength={8} required className="mt-1.5 h-11" value={next} onChange={(e) => setNext(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Сменить пароль</Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Отмена
              </Button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-destructive/30 bg-card p-6">
        <h2 className="font-sans text-lg font-bold tracking-normal">Удаление аккаунта</h2>
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
