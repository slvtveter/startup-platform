"use client";

import { LaptopIcon, LogOutIcon, SmartphoneIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  changeEmail,
  changePassword,
  deleteAccount,
  logout,
  publishMyProfile,
  resendVerification,
  revokeOtherSessions,
  revokeSession,
  updateMyProfile,
  type SessionOut,
} from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { timeAgo } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** Карточка раздела настроек: заголовок, пояснение и строки с действиями. */
export function SettingsCard({
  id,
  title,
  description,
  danger,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-24 rounded-2xl border bg-card", danger && "border-destructive/30")}>
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <h2 id={`${id}-title`} className="font-sans text-lg font-bold tracking-normal">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="mt-4 divide-y border-t">{children}</div>
    </section>
  );
}

/** Строка настройки: подпись и пояснение слева, управление справа. */
export function SettingRow({ title, hint, children }: { title: React.ReactNode; hint?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:px-6">
      <div className="min-w-0 flex-1 basis-56">
        <div className="font-medium">{title}</div>
        {hint && <div className="mt-0.5 text-sm text-muted-foreground">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

export function ProfileSettings({
  slug,
  published,
  canPublish,
  missing,
  showEmail,
}: {
  slug: string;
  published: boolean;
  canPublish: boolean;
  missing: string[];
  showEmail: boolean;
}) {
  const router = useRouter();
  const [isPublished, setPublished] = useState(published);
  const [emailVisible, setEmailVisible] = useState(showEmail);

  async function togglePublished(next: boolean) {
    setPublished(next);
    const { error } = await publishMyProfile({ body: { published: next } });
    if (error) {
      setPublished(!next);
      return toast.error(errorMessage(error));
    }
    toast.success(next ? "Профиль виден в каталоге" : "Профиль скрыт из каталога");
    router.refresh();
  }

  async function toggleEmail(next: boolean) {
    setEmailVisible(next);
    const { error } = await updateMyProfile({ body: { show_email: next } });
    if (error) {
      setEmailVisible(!next);
      return toast.error(errorMessage(error));
    }
    toast.success(next ? "Почта будет в контактах" : "Почту не показываем");
  }

  return (
    <SettingsCard id="profile" title="Профиль" description="Кто и что видит о тебе на платформе.">
      <SettingRow
        title="Показывать в каталоге людей"
        hint={
          !isPublished && !canPublish ? (
            <>
              Чтобы появиться в каталоге, заполни профиль
              {missing.length > 0 && `: ${missing.slice(0, 3).join(", ").toLowerCase()}`}.{" "}
              <Link href="/me/profile" className="font-semibold text-brand-ink hover:underline">
                Заполнить
              </Link>
            </>
          ) : isPublished ? (
            "Основатели находят тебя в поиске и могут пригласить в команду."
          ) : (
            "Профиль скрыт: в каталоге и поиске тебя не видно, откликаться можно."
          )
        }
      >
        <Switch checked={isPublished} disabled={!isPublished && !canPublish} onChange={togglePublished} aria-label="Показывать в каталоге людей" />
      </SettingRow>
      <SettingRow title="Почта в контактах" hint="После взаимного согласия показываем почту вместе с Telegram. Иначе — только Telegram.">
        <Switch checked={emailVisible} onChange={toggleEmail} aria-label="Показывать почту в контактах" />
      </SettingRow>
      <SettingRow title="Публичная страница" hint="Так профиль видят основатели.">
        <Link href={`/people/${slug}`} className="text-sm font-semibold text-brand-ink hover:underline">
          Открыть
        </Link>
      </SettingRow>
    </SettingsCard>
  );
}

export function SecuritySettings({ email, verified }: { email: string; verified: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
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
    toast.success("Пароль изменён. На других устройствах нужно войти заново.");
    setCurrent("");
    setNext("");
    setEditing(null);
  }

  async function onResend() {
    const { error } = await resendVerification();
    if (error) return toast.error(errorMessage(error));
    toast.success("Письмо отправлено ещё раз");
  }

  return (
    <>
      <SettingRow
        title={
          <span className="flex flex-wrap items-center gap-2">
            Почта
            {verified ? (
              <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success-ink">Подтверждена</span>
            ) : (
              <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn-ink">Не подтверждена</span>
            )}
          </span>
        }
        hint={<span className="break-all">{email}</span>}
      >
        <div className="flex gap-2">
          {!verified && (
            <Button variant="outline" size="sm" onClick={onResend}>
              Отправить письмо
            </Button>
          )}
          {!pendingEmail && editing !== "email" && (
            <Button variant="outline" size="sm" onClick={() => setEditing("email")}>
              Изменить
            </Button>
          )}
        </div>
      </SettingRow>
      {pendingEmail && (
        <p className="mx-5 my-4 rounded-xl bg-secondary p-3 text-sm sm:mx-6">
          Мы отправили ссылку на {pendingEmail}. Пока вы по ней не перейдёте, вход работает по текущему адресу.
        </p>
      )}
      {editing === "email" && (
        <form onSubmit={onChangeEmail} className="grid gap-4 bg-secondary/40 px-5 py-4 sm:grid-cols-2 sm:px-6">
          <div>
            <Label htmlFor="new-email">Новый адрес</Label>
            <Input id="new-email" type="email" required autoFocus className="mt-1.5 h-11 bg-card" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email-password">Текущий пароль</Label>
            <Input id="email-password" type="password" required className="mt-1.5 h-11 bg-card" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Сменить почту</Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Отмена
            </Button>
          </div>
        </form>
      )}

      <SettingRow title="Пароль" hint="Не короче 8 символов. После смены другие устройства выйдут из аккаунта.">
        {editing !== "password" && (
          <Button variant="outline" size="sm" onClick={() => setEditing("password")}>
            Изменить
          </Button>
        )}
      </SettingRow>
      {editing === "password" && (
        <form onSubmit={onChangePassword} className="grid gap-4 bg-secondary/40 px-5 py-4 sm:grid-cols-2 sm:px-6">
          <div>
            <Label htmlFor="cur">Текущий пароль</Label>
            <Input id="cur" type="password" required autoFocus className="mt-1.5 h-11 bg-card" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="new">Новый пароль</Label>
            <Input id="new" type="password" minLength={8} required className="mt-1.5 h-11 bg-card" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Сменить пароль</Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Отмена
            </Button>
          </div>
        </form>
      )}
    </>
  );
}

/** «Chrome на macOS» из User-Agent. Точность не нужна: человеку достаточно узнать своё устройство. */
export function describeDevice(ua: string): { name: string; mobile: boolean } {
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X|Macintosh/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  const browser = /YaBrowser/.test(ua)
    ? "Яндекс Браузер"
    : /Edg\//.test(ua)
      ? "Edge"
      : /OPR\/|Opera/.test(ua)
        ? "Opera"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Chrome\//.test(ua)
            ? "Chrome"
            : /Safari\//.test(ua)
              ? "Safari"
              : "";
  const name = browser && os ? `${browser} на ${os}` : browser || os || "Неизвестное устройство";
  return { name, mobile: /Mobile|iPhone|Android/.test(ua) };
}

export function SessionsSettings({ sessions }: { sessions: SessionOut[] }) {
  const router = useRouter();
  const [list, setList] = useState(sessions);
  const [all, setAll] = useState(false);
  const others = list.filter((s) => !s.current);
  // Текущий сеанс первым; остальные свежие сверху, длинный хвост прячем.
  const ordered = [...list.filter((s) => s.current), ...others];
  const LIMIT = 5;
  const shown = all ? ordered : ordered.slice(0, LIMIT);

  async function revoke(id: string) {
    const { error } = await revokeSession({ path: { session_id: id } });
    if (error) return toast.error(errorMessage(error));
    setList((l) => l.filter((s) => s.id !== id));
    toast.success("Сеанс завершён");
  }

  async function revokeOthers() {
    const { error } = await revokeOtherSessions();
    if (error) return toast.error(errorMessage(error));
    setList((l) => l.filter((s) => s.current));
    toast.success("Вышли на всех других устройствах");
    router.refresh();
  }

  return (
    <>
      <div className="px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-medium">Где выполнен вход</div>
            <div className="mt-0.5 text-sm text-muted-foreground">Не узнаёшь устройство — заверши сеанс и смени пароль.</div>
          </div>
          {others.length > 0 && (
            <Button variant="outline" size="sm" onClick={revokeOthers}>
              Выйти на других устройствах
            </Button>
          )}
        </div>
        <ul className="mt-4 grid gap-2">
          {shown.map((s) => {
            const d = describeDevice(s.user_agent);
            const Icon = d.mobile ? SmartphoneIcon : LaptopIcon;
            return (
              <li key={s.id} className="flex items-center gap-3 rounded-xl border px-3 py-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary">
                  <Icon aria-hidden className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{d.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.current ? <span className="font-semibold text-success-ink">Это устройство</span> : `Вход ${timeAgo(s.created_at)}`}
                  </div>
                </div>
                {!s.current && (
                  <Button variant="ghost" size="sm" onClick={() => revoke(s.id)}>
                    Завершить
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        {ordered.length > LIMIT && !all && (
          <button type="button" onClick={() => setAll(true)} className="mt-3 text-sm font-semibold text-brand-ink hover:underline">
            Показать ещё {ordered.length - LIMIT}
          </button>
        )}
      </div>
    </>
  );
}

export function AccountSettings({ email }: { email: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");

  async function onLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  async function onDelete() {
    const { error } = await deleteAccount();
    if (error) return toast.error(errorMessage(error));
    router.push("/");
    router.refresh();
  }

  return (
    <SettingsCard id="account" title="Аккаунт" danger>
      <SettingRow title="Выйти из аккаунта" hint="На этом устройстве.">
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOutIcon aria-hidden className="size-3.5" />
          Выйти
        </Button>
      </SettingRow>
      <SettingRow title="Удалить аккаунт" hint="Профиль, стартапы, отклики и переписка удалятся без возможности восстановления.">
        <Dialog>
          <DialogTrigger render={<Button variant="destructive" size="sm" />}>Удалить</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Удалить аккаунт навсегда?</DialogTitle>
              <DialogDescription>Чтобы подтвердить, введи свой email.</DialogDescription>
            </DialogHeader>
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={email} aria-label="Email для подтверждения" />
            <DialogFooter>
              <Button variant="destructive" disabled={confirm.trim().toLowerCase() !== email} onClick={onDelete}>
                Удалить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SettingRow>
    </SettingsCard>
  );
}
