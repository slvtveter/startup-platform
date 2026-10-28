"use client";

import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, DicesIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addStartupRole,
  createStartup,
  listRoleTemplates,
  publishStartup,
  type RoleOut,
  type RoleTemplateOut,
  type Stage,
  type Terms,
} from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { STAGE, TERMS, TERMS_HINT } from "@/lib/labels";
import { generateNames } from "@/lib/name-generator";
import { cn } from "@/lib/utils";

const STAGE_HINT: Record<string, string> = {
  idea: "Есть только идея и желание",
  prototype: "Макеты или кликабельный прототип",
  mvp: "Первая рабочая версия",
  launched: "Уже есть пользователи",
};

const MIN_DESCRIPTION = 50;

type Form = {
  title: string;
  pitch: string;
  description: string;
  stage: Stage;
  terms: Terms;
  terms_details: string;
  website: string;
  telegram: string;
};

type Step = { key: string; title: string; hint: string; ready: (f: Form, roles: Record<string, number>) => boolean };

const STEPS: Step[] = [
  { key: "title", title: "Как называется проект?", hint: "Рабочее название — потом можно поменять. Не придумывается? Жми на кубик.", ready: (f) => f.title.trim().length >= 2 },
  { key: "pitch", title: "Идея одной фразой", hint: "Что это и для кого. Её увидят в ленте первой.", ready: (f) => f.pitch.trim().length >= 10 },
  { key: "description", title: "Расскажи подробнее", hint: "Какую проблему решаете, что уже сделано, что планируете на 2–3 месяца.", ready: (f) => f.description.trim().length >= MIN_DESCRIPTION },
  { key: "stage", title: "На какой стадии проект?", hint: "Честно: новичкам важно понимать, во что они идут.", ready: () => true },
  { key: "terms", title: "На каких условиях зовёшь людей?", hint: "Условия видны на карточке стартапа и в фильтрах.", ready: () => true },
  { key: "roles", title: "Кого ищешь в команду?", hint: "Можно выбрать несколько. Задачи и часы подставим примером — после публикации поправишь их у каждой роли.", ready: (_f, r) => Object.keys(r).length > 0 },
  { key: "finish", title: "Почти готово", hint: "Ссылки необязательны, но с ними больше доверия.", ready: () => true },
];

/**
 * Пошаговое создание стартапа (KAN-138 п.4): по одному вопросу на экран, шаги сменяют друг
 * друга анимацией. В конце создаём стартап, роли по шаблонам и сразу публикуем, если можно.
 */
export function StartupWizard({ roles, emailVerified }: { roles: RoleOut[]; emailVerified: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"forward" | "back">("forward");
  const [form, setForm] = useState<Form>({
    title: "",
    pitch: "",
    description: "",
    stage: "idea",
    terms: "free",
    terms_details: "",
    website: "",
    telegram: "",
  });
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [ideas, setIdeas] = useState<string[]>([]);
  const [templates, setTemplates] = useState<Record<string, RoleTemplateOut>>({});
  const [busy, setBusy] = useState(false);
  const stepRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const current = STEPS[step];
  const ready = current.ready(form, picked);
  const last = step === STEPS.length - 1;

  useEffect(() => {
    void listRoleTemplates().then(({ data }) => setTemplates(Object.fromEntries((data ?? []).map((t) => [t.role, t]))));
  }, []);

  // Новый шаг: если начало карточки уехало вверх (длинный список ролей на телефоне) — возвращаем
  // его на экран; фокус на первое поле, чтобы можно было сразу печатать.
  useEffect(() => {
    const el = stepRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 96) window.scrollBy({ top: top - 120, behavior: "smooth" });
    el.querySelector<HTMLElement>("input, textarea")?.focus({ preventScroll: true });
  }, [step]);

  function go(delta: 1 | -1) {
    if (delta === 1 && !ready) return;
    setDir(delta === 1 ? "forward" : "back");
    setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + delta)));
  }

  function roll() {
    const names = generateNames(3);
    setIdeas(names);
    set("title", names[0]);
  }

  async function finish(publish: boolean) {
    setBusy(true);
    const created = await createStartup({ body: form });
    if (created.error) {
      setBusy(false);
      return toast.error(errorMessage(created.error));
    }
    const s = created.data!;
    for (const [role, slots] of Object.entries(picked)) {
      const t = templates[role];
      const name = roles.find((r) => r.slug === role)?.name ?? role;
      const { error } = await addStartupRole({
        path: { startup_id: s.id },
        body: {
          role,
          title: t?.title ?? name,
          description: t?.description ?? "",
          outcome: t?.outcome[form.terms] ?? "",
          hours_per_week: t?.hours_per_week ?? null,
          slots,
          skills: [],
        },
      });
      if (error) toast.error(`${name}: ${errorMessage(error)}`);
    }
    if (publish) {
      const { error } = await publishStartup({ path: { startup_id: s.id } });
      if (!error) {
        toast.success("Стартап опубликован — люди уже могут откликаться");
        router.push(`/startups/${s.slug}`);
        router.refresh();
        return;
      }
      toast.error(errorMessage(error));
    } else {
      toast.success(emailVerified ? "Черновик сохранён" : "Черновик сохранён. Подтверди почту — и можно публиковать.");
    }
    router.push(`/startups/${s.slug}/edit`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
        <span>
          Шаг {step + 1} из {STEPS.length}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label="Прогресс создания стартапа" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
          <div className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!last) go(1);
        }}
        className="mt-6 overflow-hidden rounded-3xl border bg-card p-6 sm:p-10"
      >
        <div key={current.key} ref={stepRef} className={dir === "forward" ? "wizard-step-forward" : "wizard-step-back"}>
          <h2 className="text-2xl sm:text-3xl">{current.title}</h2>
          <p className="mt-2 text-muted-foreground">{current.hint}</p>

          <div className="mt-6">
            {current.key === "title" && (
              <>
                <div className="flex gap-2">
                  <Input
                    aria-label="Название"
                    maxLength={80}
                    placeholder="Например, «Бодрый енот»"
                    className="h-14 text-lg"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                  />
                  <Button type="button" variant="outline" className="h-14 shrink-0 px-4" onClick={roll} aria-label="Придумать название" title="Придумать название">
                    <DicesIcon aria-hidden className="size-5" />
                    <span className="max-sm:hidden">Придумать</span>
                  </Button>
                </div>
                {ideas.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ideas.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => set("title", n)}
                        className={cn("rounded-full px-3 py-1.5 text-sm font-semibold transition-colors", form.title === n ? "bg-foreground text-background" : "bg-tone hover:bg-tone-2")}
                      >
                        {n}
                      </button>
                    ))}
                    <button type="button" onClick={roll} className="px-2 text-sm font-semibold text-brand-ink hover:underline">
                      Ещё варианты
                    </button>
                  </div>
                )}
              </>
            )}

            {current.key === "pitch" && (
              <>
                <Input
                  aria-label="Идея одной фразой"
                  maxLength={160}
                  placeholder="Домашняя еда от соседей с доставкой за 30 минут"
                  className="h-14 text-lg"
                  value={form.pitch}
                  onChange={(e) => set("pitch", e.target.value)}
                />
                <Counter value={form.pitch.trim().length} min={10} max={160} />
              </>
            )}

            {current.key === "description" && (
              <>
                <Textarea
                  aria-label="Подробнее о проекте"
                  rows={7}
                  placeholder={"Проблема: …\nЧто уже есть: …\nПланы на 2–3 месяца: …"}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
                <Counter value={form.description.trim().length} min={MIN_DESCRIPTION} />
              </>
            )}

            {current.key === "stage" && (
              <Choice
                options={Object.keys(STAGE).map((v) => ({ value: v, label: STAGE[v], hint: STAGE_HINT[v] }))}
                value={form.stage}
                onChange={(v) => set("stage", v as Stage)}
              />
            )}

            {current.key === "terms" && (
              <>
                <Choice
                  options={Object.keys(TERMS).map((v) => ({ value: v, label: TERMS[v], hint: TERMS_HINT[v] }))}
                  value={form.terms}
                  onChange={(v) => set("terms", v as Terms)}
                />
                <Textarea
                  rows={2}
                  className="mt-4"
                  aria-label="Детали условий"
                  placeholder={
                    form.terms === "paid"
                      ? "Сколько и как платите: «20 000 ₽ в месяц» или «60 000 ₽ за весь проект»"
                      : "Детали, если есть: часы в неделю, созвоны, что получит человек"
                  }
                  value={form.terms_details}
                  onChange={(e) => set("terms_details", e.target.value)}
                />
              </>
            )}

            {current.key === "roles" && (
              <div className="grid gap-2 sm:grid-cols-2">
                {roles.map((r) => {
                  const slots = picked[r.slug];
                  const on = slots !== undefined;
                  return (
                    <div
                      key={r.slug}
                      className={cn("flex items-center gap-2 rounded-2xl p-3 transition-colors", on ? "bg-brand-soft ring-2 ring-brand" : "bg-tone hover:bg-tone-2")}
                    >
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setPicked((p) => {
                            const next = { ...p };
                            if (on) delete next[r.slug];
                            else next[r.slug] = 1;
                            return next;
                          })
                        }
                        className="flex min-w-0 flex-1 items-center gap-2 text-left font-semibold"
                      >
                        <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border-[1.5px] border-input bg-white", on && "border-brand bg-brand text-white")}>
                          {on && <CheckIcon aria-hidden className="size-3.5" />}
                        </span>
                        <span className="truncate">{r.name}</span>
                      </button>
                      {on && (
                        <span className="flex shrink-0 items-center gap-1 text-sm" aria-label={`Мест: ${slots}`}>
                          <button type="button" className="grid size-7 place-items-center rounded-md hover:bg-secondary disabled:opacity-40" disabled={slots <= 1} onClick={() => setPicked((p) => ({ ...p, [r.slug]: slots - 1 }))} aria-label="Меньше мест">
                            <MinusIcon aria-hidden className="size-3.5" />
                          </button>
                          <span className="w-4 text-center tabular-nums">{slots}</span>
                          <button type="button" className="grid size-7 place-items-center rounded-md hover:bg-secondary disabled:opacity-40" disabled={slots >= 20} onClick={() => setPicked((p) => ({ ...p, [r.slug]: slots + 1 }))} aria-label="Больше мест">
                            <PlusIcon aria-hidden className="size-3.5" />
                          </button>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {current.key === "finish" && (
              <div className="grid gap-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input aria-label="Сайт или прототип" placeholder="Сайт или прототип: https://…" className="h-11" value={form.website} onChange={(e) => set("website", e.target.value)} />
                  <Input aria-label="Telegram-канал" placeholder="Telegram-канал: @channel" className="h-11" value={form.telegram} onChange={(e) => set("telegram", e.target.value)} />
                </div>
                <p className="rounded-2xl bg-brand-soft p-4 text-sm">
                  После публикации откроется страница проекта: там можно добавить обложку, поправить задачи каждой роли и сразу
                  найти людей под открытые места.
                </p>
                <dl className="grid gap-3 rounded-2xl bg-tone p-5 text-sm">
                  <Summary label="Название" value={form.title} onEdit={() => jump(0)} />
                  <Summary label="Идея" value={form.pitch} onEdit={() => jump(1)} />
                  <Summary label="Стадия и условия" value={`${STAGE[form.stage]}, ${TERMS[form.terms].toLowerCase()}`} onEdit={() => jump(3)} />
                  <Summary
                    label="Ищем"
                    value={Object.entries(picked)
                      .map(([slug, n]) => `${roles.find((r) => r.slug === slug)?.name ?? slug}${n > 1 ? ` ×${n}` : ""}`)
                      .join(", ")}
                    onEdit={() => jump(5)}
                  />
                </dl>
                {!emailVerified && (
                  <p className="rounded-xl bg-warn-soft p-3 text-sm text-warn-ink">
                    Публиковать можно после подтверждения почты. Сохраним черновик — опубликуешь в один клик, когда подтвердишь.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-2 border-t pt-6">
          {step > 0 && (
            <Button type="button" variant="ghost" onClick={() => go(-1)} disabled={busy}>
              <ArrowLeftIcon aria-hidden className="size-4" />
              Назад
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            {last ? (
              <>
                {emailVerified && (
                  <Button type="button" variant="outline" size="lg" onClick={() => finish(false)} disabled={busy}>
                    В черновик
                  </Button>
                )}
                <Button type="button" variant="brand" size="lg" onClick={() => finish(emailVerified)} disabled={busy}>
                  {busy ? "Создаём…" : emailVerified ? "Опубликовать" : "Сохранить черновик"}
                </Button>
              </>
            ) : (
              <Button type="submit" variant="brand" size="lg" disabled={!ready}>
                Дальше
                <ArrowRightIcon aria-hidden className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );

  function jump(to: number) {
    setDir("back");
    setStep(to);
  }
}

function Counter({ value, min, max }: { value: number; min: number; max?: number }) {
  const left = min - value;
  return (
    <p className={cn("mt-2 text-xs", left > 0 ? "text-muted-foreground" : "text-success-ink")}>
      {left > 0 ? `Ещё хотя бы ${left} симв.` : "Отлично"}
      {max ? ` · ${value}/${max}` : ""}
    </p>
  );
}

function Choice({ options, value, onChange }: { options: { value: string; label: string; hint: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("rounded-xl border p-4 text-left transition-colors", value === o.value ? "border-foreground ring-2 ring-foreground" : "hover:border-foreground/40")}
        >
          <div className="font-bold">{o.label}</div>
          <div className="mt-0.5 text-sm text-muted-foreground">{o.hint}</div>
        </button>
      ))}
    </div>
  );
}

function Summary({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 font-semibold break-words">{value || "—"}</dd>
      <button type="button" onClick={onEdit} className="shrink-0 text-xs font-semibold text-brand-ink hover:underline">
        Изменить
      </button>
    </div>
  );
}
