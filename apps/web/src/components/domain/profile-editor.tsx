"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AvatarUpload } from "@/components/domain/avatar-upload";
import { ResumeUpload } from "@/components/domain/resume-upload";
import { SkillPicker } from "@/components/domain/skill-picker";
import { usePublishWithConsent } from "@/components/domain/publish-consent";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  type LookingFor,
} from "@/lib/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { AVAILABILITY, LEVEL, LINK_KIND, TERMS, TERMS_HINT } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { goal as reachGoal } from "@/lib/metrika";

const STEPS = ["Кто ты", "Опыт и работы", "Что ищешь"];

/** Цель из развилки после регистрации (/welcome): куда вести, когда профиль готов. */
export type Goal = "idea" | "cofound" | "join";
// Новый порядок онбординга (2026-11-01): регистрация → профиль → «Что дальше?» (/welcome).
const ONBOARDING = { href: "/welcome", cta: "Опубликовать и дальше" };
const AFTER: Record<Goal, { href: string; cta: string }> = {
  idea: { href: "/startups/new", cta: "Сохранить и описать идею" },
  cofound: { href: "/people/cofounders", cta: "Сохранить и к сообщникам" },
  join: { href: "/startups", cta: "Сохранить и смотреть стартапы" },
};

type Form = {
  display_name: string;
  headline: string;
  bio: string;
  primary_role: string | null;
  experience_level: ExperienceLevel | null;
  availability: Availability | null;
  city: string;
  education: string;
  skills: string[];
  links: { kind: LinkKind; url: string }[];
  looking_for: LookingFor[];
  contact_telegram: string;
  show_email: boolean;
};
type Extra = { avatar: boolean; resume: boolean };

/**
 * Заполненность на лету, те же веса, что в API (services/profiles.py, _WEIGHTS):
 * полоска растёт, пока человек печатает, а не после сохранения. step — где поле в мастере.
 */
const COMPLETENESS: { weight: number; label: string; step: number; done: (f: Form, x: Extra) => boolean }[] = [
  { weight: 10, label: "Имя", step: 0, done: (f) => f.display_name.trim().length >= 2 },
  { weight: 15, label: "Основная роль", step: 0, done: (f) => !!f.primary_role },
  { weight: 10, label: "Фото", step: 0, done: (_, x) => x.avatar },
  { weight: 10, label: "Коротко о себе", step: 0, done: (f) => !!f.headline.trim() },
  { weight: 20, label: "3 навыка", step: 1, done: (f) => f.skills.length >= 3 },
  { weight: 10, label: "Подробнее о себе", step: 1, done: (f) => f.bio.trim().length >= 30 },
  { weight: 15, label: "Портфолио или резюме", step: 1, done: (f, x) => x.resume || f.links.some((l) => l.url.trim()) },
  { weight: 5, label: "Условия участия", step: 2, done: (f) => f.looking_for.length > 0 },
  { weight: 5, label: "Telegram", step: 2, done: (f) => !!f.contact_telegram.trim() },
];

const LINK_PLACEHOLDER: Partial<Record<LinkKind, string>> = {
  portfolio: "мой-сайт.ru или ссылка на Notion",
  github: "github.com/your-name",
  behance: "behance.net/your-name",
  linkedin: "linkedin.com/in/your-name",
  other: "https://…",
};

/** Поля, без которых профиль не опубликовать (как в API): ключ — id поля на странице. */
type FieldKey = "name" | "role" | "skills" | "terms" | "links";
const FIELD_STEP: Record<FieldKey, number> = { name: 0, role: 0, skills: 1, terms: 2, links: 1 };
const API_FIELD: Record<string, FieldKey> = { display_name: "name", primary_role: "role", skills: "skills", looking_for: "terms", links: "links", url: "links" };

function Err({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-semibold text-destructive">
      {text}
    </p>
  );
}

function Req() {
  return (
    <span aria-hidden className="ml-0.5 text-destructive">
      *
    </span>
  );
}

/** Тип ссылки — фирменный список вместо системного select (тот выглядит по-разному на каждом устройстве). */
function LinkKindSelect({ value, onChange }: { value: LinkKind; onChange: (v: LinkKind) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Тип ссылки: ${LINK_KIND[value]}`}
        className="inline-flex h-11 w-36 shrink-0 items-center justify-between gap-2 rounded-xl border border-[var(--field)] bg-white px-3.5 text-sm font-semibold transition-colors outline-none hover:border-[var(--input)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 aria-expanded:border-ring"
      >
        {LINK_KIND[value]}
        <ChevronDown aria-hidden className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44 p-1.5">
        {(Object.entries(LINK_KIND) as [LinkKind, string][]).map(([v, label]) => (
          <DropdownMenuItem key={v} onClick={() => onChange(v)} className="gap-2.5 rounded-lg py-2">
            <Check aria-hidden className={cn("size-4 text-brand", v !== value && "invisible")} />
            <span className={cn(v === value && "font-semibold")}>{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn("rounded-full px-4 py-2 text-sm font-semibold transition-colors", active ? "bg-second text-on-second" : "bg-tone hover:bg-tone-2")}
    >
      {children}
    </button>
  );
}

function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="text-sm font-semibold text-muted-foreground">{label}</span>
        <span className="ml-auto text-2xl font-extrabold tabular-nums tracking-[-0.02em]">{value}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="Профиль заполнен"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-tone"
      >
        <div
          className={cn("h-full rounded-full transition-[width,background-color] duration-500", value >= 80 ? "bg-success-ink" : "bg-brand")}
          style={{ width: `${Math.max(value, 3)}%` }}
        />
      </div>
    </div>
  );
}

export function ProfileEditor({
  profile,
  roles,
  skills,
  emailVerified,
  welcome,
  goal,
}: {
  profile: MyProfileOut;
  roles: RoleOut[];
  skills: SkillOut[];
  emailVerified: boolean;
  welcome: boolean;
  goal?: Goal;
}) {
  const router = useRouter();
  const { publish: publishWithConsent, dialog: consentDialog } = usePublishWithConsent();
  const top = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [avatar, setAvatar] = useState(!!profile.avatar_url);
  const [resume, setResume] = useState(profile.resume_name ?? "");
  const [f, setF] = useState<Form>({
    display_name: profile.display_name === "Без имени" ? "" : profile.display_name,
    headline: profile.headline,
    bio: profile.bio,
    primary_role: profile.primary_role?.slug ?? null,
    experience_level: profile.experience_level ?? null,
    availability: profile.availability ?? null,
    city: profile.city,
    education: profile.education ?? "",
    skills: profile.skills.map((s) => s.slug),
    links: profile.links.length ? profile.links.map((l) => ({ kind: l.kind, url: l.url })) : [{ kind: "portfolio" as LinkKind, url: "" }],
    looking_for: profile.looking_for as LookingFor[],
    contact_telegram: profile.contact_telegram,
    show_email: profile.show_email,
  });
  const FIELD_OF: Partial<Record<keyof Form, FieldKey>> = { display_name: "name", primary_role: "role", skills: "skills", looking_for: "terms", links: "links" };
  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setF((s) => ({ ...s, [k]: v }));
    // Поправил поле — красная подсветка с него уходит сразу.
    const key = FIELD_OF[k];
    if (key && errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const extra = { avatar, resume: !!resume };
  const score = COMPLETENESS.reduce((n, c) => n + (c.done(f, extra) ? c.weight : 0), 0);
  const missing = COMPLETENESS.filter((c) => !c.done(f, extra));
  const after = goal ? AFTER[goal] : welcome ? ONBOARDING : null;

  function go(next: number) {
    setStep(next);
    // На телефоне шаг длинный: новый начинаем сверху, с полоски заполненности.
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** Показать ошибки: перейти на шаг с первой из них, подсветить и прокрутить к полю. */
  function showErrors(errs: Partial<Record<FieldKey, string>>) {
    const keys = (Object.keys(errs) as FieldKey[]).filter((k) => errs[k]);
    if (!keys.length) return;
    setErrors(errs);
    const first = keys.sort((a, b) => FIELD_STEP[a] - FIELD_STEP[b])[0];
    setStep(FIELD_STEP[first]);
    toast.error(keys.length > 1 ? "Заполни поля, отмеченные красным" : errs[first]!);
    // Шаг перерисуется — тогда и прокручиваем к полю.
    setTimeout(() => {
      const el = document.getElementById(`field-${first}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      (el?.querySelector("input, button") as HTMLElement | null)?.focus({ preventScroll: true });
    }, 50);
  }

  /** Обязательные поля (то же, что API проверяет перед публикацией); onlyStep — только поля шага. */
  function validate(onlyStep?: number): Partial<Record<FieldKey, string>> {
    const errs: Partial<Record<FieldKey, string>> = {};
    const name = f.display_name.trim();
    if (name.length < 2) errs.name = name ? "Имя — минимум 2 буквы" : "Укажи имя или псевдоним";
    if (!f.primary_role) errs.role = "Выбери основную роль";
    if (f.skills.length === 0) errs.skills = "Добавь хотя бы один навык";
    if (f.looking_for.length === 0) errs.terms = "Выбери хотя бы одно условие";
    // Ссылка без точки или с пробелами — не адрес: API её не примет, лучше сказать сразу у поля.
    if (f.links.some((l) => l.url.trim() && (/\s/.test(l.url.trim()) || !l.url.includes("."))))
      errs.links = "Проверь ссылку: нужен адрес вида github.com/имя";
    if (onlyStep === undefined) return errs;
    return Object.fromEntries(Object.entries(errs).filter(([k]) => FIELD_STEP[k as FieldKey] === onlyStep));
  }

  /** «Дальше»: не пускаем на следующий шаг с незаполненными обязательными полями этого шага. */
  function next() {
    const errs = validate(step);
    if (Object.keys(errs).length) return showErrors(errs);
    save(step + 1);
  }

  async function save(next?: number) {
    setBusy(true);
    const body = {
      ...f,
      display_name: f.display_name.trim() || undefined,
      links: f.links.filter((l) => l.url.trim()).map((l) => ({ ...l, url: /^https?:\/\//.test(l.url) ? l.url : `https://${l.url}` })),
    };
    const { error } = await updateMyProfile({ body });
    setBusy(false);
    if (error) {
      const mapped = Object.fromEntries(
        Object.entries(fieldErrors(error)).flatMap(([k, v]) => {
          const key = API_FIELD[k.split(".")[0]] ?? API_FIELD[k.split(".").pop()!];
          return key ? [[key, key === "links" ? "Проверь ссылку: нужен адрес вида github.com/имя" : v]] : [];
        }),
      );
      if (Object.keys(mapped).length) showErrors(mapped);
      else toast.error(errorMessage(error));
      return false;
    }
    if (next !== undefined) go(next);
    else toast.success("Сохранено");
    router.refresh();
    return true;
  }

  /** Уже опубликованный профиль: проверить, сохранить и показать, как его видят. */
  async function saveAndView() {
    const errs = validate();
    if (Object.keys(errs).length) return showErrors(errs);
    if (await save()) router.push("/me/profile");
  }

  async function publish(published: boolean) {
    if (published) {
      const errs = validate();
      if (Object.keys(errs).length) return showErrors(errs);
    }
    if (!(await save())) return;
    if (published) {
      const r = await publishWithConsent();
      if (!r.ok) return r.message ? toast.error(r.message) : undefined;
    } else {
      const { error } = await publishMyProfile({ body: { published } });
      if (error) return toast.error(errorMessage(error));
    }
    if (published) reachGoal("profile_published");
    toast.success(published ? "Профиль опубликован" : "Профиль скрыт из каталога");
    if (published && after) router.push(after.href);
    else if (published) router.push("/me/profile");
    else router.refresh();
  }

  // Порог каталога «Люди» (как в API): роль, описание в одну строку и хотя бы один навык.
  const catalogMissing = [
    !profile.primary_role && "роль",
    !profile.headline && "пару слов о себе",
    profile.skills.length === 0 && "хотя бы один навык",
  ].filter(Boolean) as string[];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {consentDialog}
      <div ref={top} className="scroll-mt-24 rounded-[28px] bg-card p-6 shadow-[0_0_0_1px_var(--border)] sm:p-8">
        {/* На телефоне боковая колонка уходит вниз — полоска нужна здесь; на широком экране она справа. */}
        <div className="mb-6 lg:hidden">
          <Progress value={score} label="Профиль заполнен" />
          {missing.length > 0 && <p className="mt-2 text-sm text-muted-foreground">Дальше: {missing[0].label.toLowerCase()}</p>}
        </div>

        <ol className="flex flex-wrap items-center gap-3 text-sm font-bold">
          {STEPS.map((title, i) => (
            <li key={title} className="flex items-center gap-3">
              <button type="button" onClick={() => go(i)} aria-current={i === step ? "step" : undefined} className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full transition-colors duration-200",
                    i === step ? "bg-brand text-primary-foreground" : i < step ? "bg-second text-on-second" : "bg-tone text-muted-foreground",
                  )}
                >
                  {i < step ? <Check aria-hidden className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                {/* На телефоне подписан только текущий шаг: три названия не помещаются в строку. */}
                <span className={i === step ? "" : "text-muted-foreground max-sm:sr-only"}>{title}</span>
              </button>
              {i < STEPS.length - 1 && <span className="h-px w-4 bg-border sm:w-8" />}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div key="s0" className="wizard-step-forward mt-8 grid gap-6">
            <AvatarUpload name={f.display_name || profile.display_name} initialUrl={profile.avatar_url ?? null} onChange={(u) => setAvatar(!!u)} />
            <div id="field-name" className="scroll-mt-28">
              <Label htmlFor="name">
                Имя или псевдоним
                <Req />
              </Label>
              <Input
                id="name"
                autoComplete="name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                className="mt-1.5 h-11"
                value={f.display_name}
                onChange={(e) => set("display_name", e.target.value)}
                placeholder="Мария Ким"
              />
              <Err id="name-error" text={errors.name} />
            </div>
            <div id="field-role" className="scroll-mt-28">
              <Label>
                Основная роль
                <Req />
              </Label>
              <div
                role="group"
                aria-describedby={errors.role ? "role-error" : undefined}
                className={cn("mt-2 flex flex-wrap gap-2", errors.role && "-m-2 rounded-2xl p-2 ring-2 ring-destructive/60")}
              >
                {roles.map((r) => (
                  <Choice key={r.slug} active={f.primary_role === r.slug} onClick={() => set("primary_role", r.slug)}>
                    {r.name}
                  </Choice>
                ))}
              </div>
              <Err id="role-error" text={errors.role} />
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
              <p className="mt-1 text-xs text-muted-foreground">Одна строка о себе.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="education">Учёба</Label>
                <Input id="education" maxLength={120} className="mt-1.5 h-11" value={f.education} onChange={(e) => set("education", e.target.value)} placeholder="ИТМО, 3 курс" />
              </div>
              <div>
                <Label htmlFor="city">Город</Label>
                <Input id="city" className="mt-1.5 h-11" value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Казань или «онлайн»" />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div key="s1" className="wizard-step-forward mt-8 grid gap-6">
            <div id="field-skills" className="scroll-mt-28">
              <h2 className="text-2xl">
                Что ты умеешь?
                <Req />
              </h2>
              <p className="mt-1 text-muted-foreground">Начни вводить название навыка.</p>
              <div className={cn("mt-4", errors.skills && "-m-2 mt-2 rounded-2xl p-2 ring-2 ring-destructive/60")}>
                <SkillPicker all={skills} value={f.skills} onChange={(v) => set("skills", v)} role={f.primary_role} />
              </div>
              <Err id="skills-error" text={errors.skills} />
            </div>
            <div>
              <Label htmlFor="bio">Расскажи подробнее</Label>
              <Textarea id="bio" rows={5} className="mt-1.5" value={f.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Что уже делал, чему хочешь научиться, сколько времени готов уделять" />
            </div>
            <div>
              <Label>Резюме</Label>
              <div className="mt-2">
                <ResumeUpload slug={profile.slug} name={resume} onChange={setResume} />
              </div>
            </div>
            <div>
              <Label>Работы и портфолио</Label>
              <div id="field-links" className="mt-2 grid scroll-mt-28 gap-2">
                {f.links.map((l, i) => (
                  <div key={i} className="flex flex-col gap-2 sm:flex-row">
                    <LinkKindSelect value={l.kind} onChange={(kind) => set("links", f.links.map((x, j) => (j === i ? { ...x, kind } : x)))} />
                    <Input aria-label="Ссылка" className="h-11" value={l.url} onChange={(e) => set("links", f.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} placeholder={LINK_PLACEHOLDER[l.kind] ?? "https://…"} aria-invalid={!!errors.links} />
                  </div>
                ))}
                {f.links.length < 8 && (
                  <button type="button" onClick={() => set("links", [...f.links, { kind: "other", url: "" }])} className="w-fit text-sm font-bold text-brand-ink transition-colors hover:text-brand-hover">
                    + Ещё ссылка
                  </button>
                )}
              </div>
              <Err id="links-error" text={errors.links} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div key="s2" className="wizard-step-forward mt-8 grid gap-6">
            <button
              type="button"
              role="switch"
              aria-checked={f.looking_for.includes("cofound")}
              onClick={() =>
                set("looking_for", f.looking_for.includes("cofound") ? f.looking_for.filter((x) => x !== "cofound") : [...f.looking_for, "cofound"])
              }
              className={cn(
                "flex items-start gap-4 rounded-2xl p-5 text-left transition-colors duration-200",
                f.looking_for.includes("cofound") ? "bg-brand-soft ring-2 ring-brand" : "bg-tone hover:bg-tone-2",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200",
                  f.looking_for.includes("cofound") ? "bg-brand" : "bg-input",
                )}
              >
                <span
                  className={cn(
                    "size-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                    f.looking_for.includes("cofound") && "translate-x-4",
                  )}
                />
              </span>
              <span>
                <span className="block font-bold">Ищу сообщников, чтобы придумать стартап с нуля</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Идея не нужна.
                </span>
              </span>
            </button>
            <div id="field-terms" className="scroll-mt-28">
              <Label>
                На каких условиях готов работать
                <Req />
              </Label>
              <div className={cn("mt-2 grid gap-2 sm:grid-cols-3", errors.terms && "-m-2 rounded-2xl p-2 ring-2 ring-destructive/60")}>
                {(["free", "paid", "negotiable"] as LookingFor[]).map((t) => {
                  const on = f.looking_for.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set("looking_for", on ? f.looking_for.filter((x) => x !== t) : [...f.looking_for, t])}
                      className={cn("rounded-2xl p-4 text-left transition-colors duration-200", on ? "bg-brand-soft ring-2 ring-brand" : "bg-tone hover:bg-tone-2")}
                    >
                      <div className="font-bold">{TERMS[t]}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{TERMS_HINT[t]}</div>
                    </button>
                  );
                })}
              </div>
              <Err id="terms-error" text={errors.terms} />
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
            <div className="rounded-2xl bg-tone p-5">
              <div className="font-bold">Контакты</div>
              <p className="mt-1 text-sm text-muted-foreground">В каталоге не показываются.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="tg">Telegram</Label>
                  <Input id="tg" className="mt-1.5 h-11 bg-card" value={f.contact_telegram} onChange={(e) => set("contact_telegram", e.target.value)} placeholder="@username" />
                </div>
                <label className="flex items-center gap-2 self-end pb-3 text-sm">
                  <input type="checkbox" checked={f.show_email} onChange={(e) => set("show_email", e.target.checked)} className="check" />
                  Показывать почту, когда договоритесь
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-2 border-t pt-6">
          {step > 0 ? (
            <Button variant="outline" size="lg" onClick={() => save(step - 1)} disabled={busy}>
              Назад
            </Button>
          ) : (
            after && (
              <Link href={after.href} className="px-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
                Заполню позже
              </Link>
            )
          )}
          <div className="ml-auto flex gap-2">
            {step < STEPS.length - 1 ? (
              <>
                {/* Опубликованный профиль правят точечно: сохранить можно с любого шага. */}
                {profile.is_published && !after && (
                  <Button size="lg" variant="outline" onClick={saveAndView} disabled={busy}>
                    Сохранить
                  </Button>
                )}
                <Button size="lg" onClick={next} disabled={busy}>
                  {busy && <Loader2 aria-hidden className="animate-spin" />}
                  Дальше
                </Button>
              </>
            ) : profile.is_published ? (
              <Button size="lg" onClick={() => (after ? publish(true) : saveAndView())} disabled={busy}>
                {busy && <Loader2 aria-hidden className="animate-spin" />}
                {after ? after.cta : "Сохранить"}
              </Button>
            ) : (
              <Button variant="brand" size="lg" onClick={() => publish(true)} disabled={busy}>
                {busy && <Loader2 aria-hidden className="animate-spin" />}
                {after ? "Опубликовать и продолжить" : "Сохранить и опубликовать"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <aside className="grid h-fit gap-4 lg:sticky lg:top-24">
        {/* На телефоне полоска уже есть над шагами — здесь не повторяем. */}
        <div className="rounded-[28px] bg-tone p-6 max-lg:hidden">
          <Progress value={score} label="Профиль заполнен" />
          {missing.length > 0 ? (
            <>
              <p className="mt-5 text-sm font-semibold">Что добавить дальше</p>
              <ul className="mt-2 grid gap-1">
                {missing.slice(0, 3).map((c) => (
                  <li key={c.label}>
                    <button
                      type="button"
                      onClick={() => go(c.step)}
                      className="flex w-full items-center gap-2.5 rounded-lg py-1.5 text-left text-sm transition-colors hover:text-brand-ink"
                    >
                      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-brand" />
                      {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-5 text-sm font-semibold text-success-ink">Профиль заполнен полностью</p>
          )}
          {missing.length > 0 && <p className="mt-4 text-xs text-muted-foreground">По фото и портфолио основателю проще понять, кто ты и что умеешь.</p>}
        </div>
        <div className="rounded-[28px] bg-tone p-6">
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
              <Button variant="brand" size="sm" onClick={() => publish(true)} disabled={busy}>
                Опубликовать
              </Button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
