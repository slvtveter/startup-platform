"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AvatarUpload } from "@/components/domain/avatar-upload";
import { SkillPicker } from "@/components/domain/skill-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  publishMyProfile,
  updateMyProfile,
  type Availability,
  type ExperienceLevel,
  type LinkKind,
  type MyProfileOut,
  type RoleOut,
  type SkillOut,
  type Terms,
} from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { AVAILABILITY, LEVEL, LINK_KIND, TERMS, TERMS_HINT } from "@/lib/labels";
import { cn } from "@/lib/utils";

const STEPS = ["Кто ты", "Навыки и работы", "Что ищешь"];

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("rounded-full border px-4 py-2 text-sm font-semibold transition-colors", active ? "border-foreground bg-foreground text-background" : "bg-card hover:border-foreground/40")}
    >
      {children}
    </button>
  );
}

export function ProfileEditor({
  profile,
  roles,
  skills,
  emailVerified,
  welcome,
}: {
  profile: MyProfileOut;
  roles: RoleOut[];
  skills: SkillOut[];
  emailVerified: boolean;
  welcome: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    display_name: profile.display_name === "Без имени" ? "" : profile.display_name,
    headline: profile.headline,
    bio: profile.bio,
    primary_role: profile.primary_role?.slug ?? null,
    experience_level: profile.experience_level ?? null,
    availability: profile.availability ?? null,
    city: profile.city,
    skills: profile.skills.map((s) => s.slug),
    links: profile.links.length ? profile.links.map((l) => ({ kind: l.kind, url: l.url })) : [{ kind: "portfolio" as LinkKind, url: "" }],
    looking_for: profile.looking_for as Terms[],
    contact_telegram: profile.contact_telegram,
    show_email: profile.show_email,
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  async function save(next?: number) {
    setBusy(true);
    const body = {
      ...f,
      display_name: f.display_name.trim() || undefined,
      links: f.links.filter((l) => l.url.trim()).map((l) => ({ ...l, url: /^https?:\/\//.test(l.url) ? l.url : `https://${l.url}` })),
    };
    const { error } = await updateMyProfile({ body });
    setBusy(false);
    if (error) return toast.error(errorMessage(error));
    if (next !== undefined) setStep(next);
    else toast.success("Сохранено");
    router.refresh();
  }

  async function publish(published: boolean) {
    await save();
    const { error } = await publishMyProfile({ body: { published } });
    if (error) return toast.error(errorMessage(error));
    toast.success(published ? "Профиль опубликован" : "Профиль скрыт из каталога");
    router.refresh();
    if (published && welcome) router.push("/startups");
  }

  // Порог каталога «Люди» (как в API): роль, описание в одну строку и хотя бы один навык.
  const catalogMissing = [
    !profile.primary_role && "роль",
    !profile.headline && "пару слов о себе",
    profile.skills.length === 0 && "хотя бы один навык",
  ].filter(Boolean) as string[];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="rounded-3xl border bg-card p-6 sm:p-8">
        <ol className="flex flex-wrap items-center gap-3 text-sm font-bold">
          {STEPS.map((title, i) => (
            <li key={title} className="flex items-center gap-3">
              <button type="button" onClick={() => setStep(i)} className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full",
                    i === step ? "bg-brand text-primary-foreground" : i < step ? "bg-foreground text-background" : "border-2 text-muted-foreground",
                  )}
                >
                  {i < step ? "✓" : i + 1}
                </span>
                <span className={i === step ? "" : "text-muted-foreground"}>{title}</span>
              </button>
              {i < STEPS.length - 1 && <span className="hidden h-px w-8 bg-border sm:block" />}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="mt-8 grid gap-6">
            <AvatarUpload name={f.display_name || profile.display_name} initialUrl={profile.avatar_url ?? null} />
            <div>
              <Label htmlFor="name">Имя или псевдоним</Label>
              <Input id="name" className="mt-1.5 h-11" value={f.display_name} onChange={(e) => set("display_name", e.target.value)} placeholder="Мария Ким" />
            </div>
            <div>
              <Label>Основная роль</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {roles.map((r) => (
                  <Choice key={r.slug} active={f.primary_role === r.slug} onClick={() => set("primary_role", r.slug)}>
                    {r.name}
                  </Choice>
                ))}
              </div>
            </div>
            <div>
              <Label>Опыт</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(LEVEL) as ExperienceLevel[]).map((l) => (
                  <Choice key={l} active={f.experience_level === l} onClick={() => set("experience_level", l)}>
                    {LEVEL[l]}
                  </Choice>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="headline">Коротко о себе</Label>
              <Input id="headline" maxLength={140} className="mt-1.5 h-11" value={f.headline} onChange={(e) => set("headline", e.target.value)} placeholder="UI/UX дизайнер после курсов, ищу первый реальный проект" />
            </div>
            <div>
              <Label htmlFor="bio">Подробнее</Label>
              <Textarea id="bio" rows={5} className="mt-1.5" value={f.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Что уже делал, чему хочешь научиться, сколько времени готов уделять" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="city">Город</Label>
                <Input id="city" className="mt-1.5 h-11" value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Казань или «онлайн»" />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-8 grid gap-6">
            <div>
              <h2 className="text-2xl">Что ты умеешь?</h2>
              <p className="mt-1 text-muted-foreground">По навыкам основатели найдут тебя в каталоге, а мы подберём подходящие стартапы.</p>
              <div className="mt-4">
                <SkillPicker all={skills} value={f.skills} onChange={(v) => set("skills", v)} />
              </div>
            </div>
            <div>
              <Label>Работы и портфолио</Label>
              <div className="mt-2 grid gap-2">
                {f.links.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <select
                      value={l.kind}
                      onChange={(e) => set("links", f.links.map((x, j) => (j === i ? { ...x, kind: e.target.value as LinkKind } : x)))}
                      className="h-11 rounded-lg border bg-card px-2 text-sm"
                    >
                      {Object.entries(LINK_KIND).map(([v, label]) => (
                        <option key={v} value={v}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <Input className="h-11" value={l.url} onChange={(e) => set("links", f.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} placeholder="behance.net/your-name" />
                  </div>
                ))}
                {f.links.length < 8 && (
                  <button type="button" onClick={() => set("links", [...f.links, { kind: "other", url: "" }])} className="w-fit text-sm font-bold hover:underline">
                    + Ещё ссылка
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8 grid gap-6">
            <div>
              <Label>На каких условиях готов работать</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {(["free", "paid", "negotiable"] as Terms[]).map((t) => {
                  const on = f.looking_for.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("looking_for", on ? f.looking_for.filter((x) => x !== t) : [...f.looking_for, t])}
                      className={cn("rounded-xl border p-4 text-left", on ? "border-foreground ring-2 ring-foreground" : "hover:border-foreground/40")}
                    >
                      <div className="font-bold">{TERMS[t]}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{TERMS_HINT[t]}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Сколько времени готов уделять</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(AVAILABILITY) as Availability[]).map((a) => (
                  <Choice key={a} active={f.availability === a} onClick={() => set("availability", a)}>
                    {AVAILABILITY[a]}
                  </Choice>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-secondary p-5">
              <div className="font-bold">Контакты</div>
              <p className="mt-1 text-sm text-muted-foreground">Не видны в каталоге. Откроются только тем, с кем вы взаимно договоритесь.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="tg">Telegram</Label>
                  <Input id="tg" className="mt-1.5 h-11 bg-card" value={f.contact_telegram} onChange={(e) => set("contact_telegram", e.target.value)} placeholder="@username" />
                </div>
                <label className="flex items-center gap-2 self-end pb-3 text-sm">
                  <input type="checkbox" checked={f.show_email} onChange={(e) => set("show_email", e.target.checked)} className="size-4 accent-[var(--brand)]" />
                  Показывать email после согласия
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-2 border-t pt-6">
          {step > 0 && (
            <Button variant="outline" size="lg" onClick={() => save(step - 1)} disabled={busy}>
              Назад
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            {step < STEPS.length - 1 ? (
              <Button size="lg" onClick={() => save(step + 1)} disabled={busy}>
                Дальше
              </Button>
            ) : profile.is_published ? (
              <Button size="lg" onClick={() => save()} disabled={busy}>
                Сохранить
              </Button>
            ) : (
              <Button variant="brand" size="lg" onClick={() => publish(true)} disabled={busy}>
                Сохранить и опубликовать
              </Button>
            )}
          </div>
        </div>
      </div>

      <aside className="grid h-fit gap-4 lg:sticky lg:top-24">
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-baseline">
            <span className="font-bold">Профиль заполнен</span>
            <span className="ml-auto text-2xl font-bold">{profile.completeness}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${profile.completeness}%` }} />
          </div>
          {profile.missing.length > 0 && (
            <ul className="mt-4 grid gap-1 text-sm text-muted-foreground">
              {profile.missing.map((m) => (
                <li key={m}>+ {m}</li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">С портфолио и рассказом о себе основатели отвечают заметно чаще.</p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <div className="font-bold">{profile.is_published ? "Опубликован" : "Не опубликован"}</div>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.is_published ? "Профиль открыт по ссылке, можно откликаться." : "Пока профиль скрыт, нельзя откликаться и тебя не найдут в каталоге."}
          </p>
          {profile.is_published && catalogMissing.length > 0 && (
            <p className="mt-3 rounded-lg bg-marker-soft p-3 text-sm text-marker-ink">
              Чтобы попасть в каталог людей, добавь: {catalogMissing.join(", ")}.
            </p>
          )}
          {!emailVerified && <p className="mt-3 rounded-lg bg-warn-soft p-3 text-sm text-warn-ink">Сначала подтверди email: письмо уже в почте.</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.is_published ? (
              <>
                <Link href={`/people/${profile.slug}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Как меня видят
                </Link>
                <Button variant="ghost" size="sm" onClick={() => publish(false)}>
                  Снять с публикации
                </Button>
              </>
            ) : (
              <Button variant="brand" size="sm" onClick={() => publish(true)} disabled={!profile.can_publish && !emailVerified}>
                Опубликовать
              </Button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
