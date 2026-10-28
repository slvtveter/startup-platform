"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SeatRow } from "@/components/domain/seats";
import { SkillPicker } from "@/components/domain/skill-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addStartupRole,
  archiveStartup,
  closeStartup,
  createStartup,
  deleteStartupRole,
  listRoleTemplates,
  publishStartup,
  updateStartup,
  updateStartupRole,
  type RoleOut,
  type RoleTemplateOut,
  type SkillOut,
  type Stage,
  type StartupDetail,
  type Terms,
} from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { STAGE, TERMS, TERMS_HINT, plural } from "@/lib/labels";
import { cn } from "@/lib/utils";

type Base = {
  title: string;
  pitch: string;
  description: string;
  progress: string;
  plans: string;
  stage: Stage;
  terms: Terms;
  terms_details: string;
  website: string;
  telegram: string;
};

export function StartupEditor({ startup, roles, skills }: { startup?: StartupDetail; roles: RoleOut[]; skills: SkillOut[] }) {
  const router = useRouter();
  const [form, setForm] = useState<Base>({
    title: startup?.title ?? "",
    pitch: startup?.pitch ?? "",
    description: startup?.description ?? "",
    progress: startup?.progress ?? "",
    plans: startup?.plans ?? "",
    stage: startup?.stage ?? "idea",
    terms: startup?.terms ?? "free",
    terms_details: startup?.terms_details ?? "",
    website: startup?.website ?? "",
    telegram: startup?.telegram ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [blockers, setBlockers] = useState<string[]>([]);
  const set = <K extends keyof Base>(k: K, v: Base[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = startup ? await updateStartup({ path: { startup_id: startup.id }, body: form }) : await createStartup({ body: form });
    setBusy(false);
    if (res.error) return toast.error(errorMessage(res.error));
    if (!startup) {
      toast.success("Черновик создан. Теперь добавь роли, которые ищешь.");
      router.push(`/startups/${res.data!.slug}/edit`);
      return;
    }
    toast.success("Сохранено");
    router.refresh();
  }

  async function publish() {
    if (!startup) return;
    const { error } = await publishStartup({ path: { startup_id: startup.id } });
    if (error) {
      const details = (error as { error?: { details?: unknown } }).error?.details;
      setBlockers(Array.isArray(details) ? (details as string[]) : [errorMessage(error)]);
      return;
    }
    setBlockers([]);
    toast.success("Стартап опубликован и виден в ленте");
    router.push(`/startups/${startup.slug}`);
    router.refresh();
  }

  async function changeStatus(kind: "close" | "archive") {
    if (!startup) return;
    const fn = kind === "close" ? closeStartup : archiveStartup;
    const { error } = await fn({ path: { startup_id: startup.id } });
    if (error) return toast.error(errorMessage(error));
    toast.success(kind === "close" ? "Набор закрыт" : "Стартап в архиве");
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <form onSubmit={save} className="grid content-start gap-6 rounded-3xl bg-tone p-6 sm:p-8">
        <div>
          <Label htmlFor="title">Название</Label>
          <Input id="title" required minLength={2} maxLength={80} className="mt-1.5 h-11" value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="pitch">Идея одной фразой</Label>
          <Input id="pitch" maxLength={160} placeholder="Домашняя еда от соседей с доставкой за 30 минут" className="mt-1.5 h-11" value={form.pitch} onChange={(e) => set("pitch", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="description">Какую проблему решаете</Label>
          <Textarea
            id="description"
            rows={7}
            className="mt-1.5"
            placeholder="Кому сейчас плохо и почему — главный рассказ о проекте"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">{form.description.length} символов, для публикации нужно от 50</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="progress">Что уже есть</Label>
            <Textarea id="progress" rows={4} className="mt-1.5" placeholder="Макеты, прототип, первые пользователи" value={form.progress} onChange={(e) => set("progress", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="plans">Планы на 2–3 месяца</Label>
            <Textarea id="plans" rows={4} className="mt-1.5" placeholder="Что хотите успеть с командой" value={form.plans} onChange={(e) => set("plans", e.target.value)} />
          </div>
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Стадия</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(STAGE) as Stage[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => set("stage", st)}
                className={cn("rounded-full border px-4 py-2 text-sm font-semibold", form.stage === st && "border-foreground bg-foreground text-background")}
              >
                {STAGE[st]}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-medium">Условия участия</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {(Object.keys(TERMS) as Terms[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("terms", t)}
                className={cn("rounded-xl border p-4 text-left transition-colors", form.terms === t ? "border-foreground ring-2 ring-foreground" : "hover:border-foreground/40")}
              >
                <div className="font-bold">{TERMS[t]}</div>
                <div className="mt-0.5 text-sm text-muted-foreground">{TERMS_HINT[t]}</div>
              </button>
            ))}
          </div>
          <Textarea
            rows={3}
            className="mt-3"
            placeholder={form.terms === "paid" ? "Сколько и как платите: например, «20 000 ₽ в месяц» или «60 000 ₽ за весь проект»" : "Детали: сколько часов в неделю, как часто созвоны, что получит человек"}
            value={form.terms_details}
            onChange={(e) => set("terms_details", e.target.value)}
          />
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="website">Сайт или прототип</Label>
            <Input id="website" placeholder="https://..." className="mt-1.5 h-11" value={form.website} onChange={(e) => set("website", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="telegram">Telegram-канал</Label>
            <Input id="telegram" placeholder="@channel" className="mt-1.5 h-11" value={form.telegram} onChange={(e) => set("telegram", e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={busy}>
            {startup ? "Сохранить" : "Создать черновик"}
          </Button>
        </div>
      </form>

      <aside className="grid h-fit gap-4 lg:sticky lg:top-24">
        {startup ? (
          <>
            <RolesEditor startup={startup} roles={roles} skills={skills} />
            <div className="rounded-2xl border bg-card p-5">
              {startup.status === "recruiting" ? (
                <>
                  <div className="font-bold">Набор открыт</div>
                  <p className="mt-1 text-sm text-muted-foreground">Стартап виден в ленте.</p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" onClick={() => changeStatus("close")}>
                      Закрыть набор
                    </Button>
                    <Button variant="ghost" onClick={() => changeStatus("archive")}>
                      В архив
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="font-bold">{startup.status === "draft" ? "Черновик" : "Набор закрыт"}</div>
                  <p className="mt-1 text-sm text-muted-foreground">Опубликуй, чтобы стартап появился в ленте и на него можно было откликнуться.</p>
                  {blockers.length > 0 && (
                    <ul className="mt-3 grid gap-1 rounded-xl bg-warn-soft p-3 text-sm text-warn-ink">
                      {blockers.map((b) => (
                        <li key={b}>• {b}</li>
                      ))}
                    </ul>
                  )}
                  <Button variant="brand" className="mt-4 w-full" onClick={publish}>
                    Опубликовать
                  </Button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-2xl bg-secondary p-5 text-sm text-muted-foreground">
            <div className="font-bold text-foreground">Как это работает</div>
            <ol className="mt-2 grid list-decimal gap-1 pl-4">
              <li>Опиши идею и условия, создай черновик.</li>
              <li>Добавь роли, которые ищешь: кто нужен, задачи, навыки.</li>
              <li>Опубликуй: стартап появится в ленте, люди начнут откликаться.</li>
            </ol>
          </div>
        )}
      </aside>
    </div>
  );
}

function RolesEditor({ startup, roles, skills }: { startup: StartupDetail; roles: RoleOut[]; skills: SkillOut[] }) {
  const router = useRouter();
  const empty = {
    role: roles[0]?.slug ?? "",
    title: "",
    description: "",
    outcome: "",
    hours_per_week: null as number | null,
    slots: 1,
    skills: [] as string[],
  };
  const [draft, setDraft] = useState(empty);
  const [adding, setAdding] = useState(startup.roles.length === 0);
  // id роли, которую сейчас правим в той же форме; null — добавляем новую.
  const [editing, setEditing] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Record<string, RoleTemplateOut>>({});

  // Шаблоны ролей (KAN-98): пример задач, часов и «что получишь» для каждой роли справочника.
  useEffect(() => {
    void listRoleTemplates().then(({ data }) => {
      const byRole = Object.fromEntries((data ?? []).map((t) => [t.role, t]));
      setTemplates(byRole);
      setDraft((d) => fillFromTemplate(d, undefined, byRole[d.role], startup.terms));
    });
  }, [startup.terms]);

  function chooseRole(role: string) {
    setDraft((d) => fillFromTemplate({ ...d, role }, templates[d.role], templates[role], startup.terms));
  }

  function applyExample() {
    const t = templates[draft.role];
    if (!t) return;
    setDraft((d) => ({ ...d, title: t.title, description: t.description, hours_per_week: t.hours_per_week, outcome: t.outcome[startup.terms] ?? "" }));
  }

  async function add() {
    const { role, ...fields } = draft;
    const { error } = editing
      ? await updateStartupRole({ path: { role_id: editing }, body: fields })
      : await addStartupRole({ path: { startup_id: startup.id }, body: { role, ...fields } });
    if (error) return toast.error(errorMessage(error));
    toast.success(editing ? "Роль сохранена" : "Роль добавлена");
    closeForm();
    router.refresh();
  }

  function closeForm() {
    setDraft(fillFromTemplate(empty, undefined, templates[empty.role], startup.terms));
    setEditing(null);
    setAdding(false);
  }

  function edit(r: StartupDetail["roles"][number]) {
    setDraft({
      role: r.role.slug,
      title: r.title,
      description: r.description,
      outcome: r.outcome ?? "",
      hours_per_week: r.hours_per_week ?? null,
      slots: r.slots ?? 1,
      skills: r.skills.map((x) => x.slug),
    });
    setEditing(r.id);
    setAdding(true);
    // Форма роли ниже экрана: показываем её и ставим курсор в название.
    requestAnimationFrame(() => {
      const el = document.getElementById("role-form");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      el?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
    });
  }

  async function toggle(id: string, is_open: boolean) {
    const { error } = await updateStartupRole({ path: { role_id: id }, body: { is_open } });
    if (error) return toast.error(errorMessage(error));
    router.refresh();
  }

  async function remove(id: string) {
    const { error } = await deleteStartupRole({ path: { role_id: id } });
    if (error) return toast.error(errorMessage(error));
    router.refresh();
  }

  return (
    <div className="rounded-[28px] bg-tone p-5 sm:p-6">
      <div className="text-lg font-extrabold tracking-[-0.02em]">Места в команде</div>
      <p className="mt-1 text-sm text-muted-foreground">
        Чем конкретнее задачи, часы и то, что человек получит, тем больше откликов.
      </p>
      <div className="mt-4 rounded-2xl bg-white p-3">
        <div className="text-xs text-muted-foreground">Так команду увидят на странице проекта</div>
        <div className="mt-2 flex items-center gap-3">
          <SeatRow
            filled={startup.team.length}
            open={startup.roles.filter((r) => r.is_open).reduce((n, r) => n + Math.max(0, (r.slots ?? 1) - (r.filled ?? 0)), 0)}
          />
        </div>
      </div>
      <ul className="mt-3 grid gap-2">
        {startup.roles.map((r) => (
          <li key={r.id} className={`rounded-2xl bg-white p-4 ${editing === r.id ? "ring-2 ring-brand" : ""}`}>
            <div className="min-w-0">
              <div className="truncate font-bold">{r.title}</div>
              <div className="text-sm text-muted-foreground">
                {[
                  r.role.name !== r.title ? r.role.name : null,
                  plural(r.slots ?? 1, `${r.slots ?? 1} место`, `${r.slots ?? 1} места`, `${r.slots ?? 1} мест`),
                  r.hours_per_week ? `${r.hours_per_week} ч/нед` : null,
                  r.is_open ? null : "набор закрыт",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
            <div className="mt-3 flex gap-4 text-sm font-semibold">
              <button type="button" onClick={() => edit(r)} className="text-brand-ink hover:underline">
                Изменить
              </button>
              <button type="button" onClick={() => toggle(r.id, !r.is_open)} className="hover:underline">
                {r.is_open ? "Закрыть" : "Открыть"}
              </button>
              <button type="button" onClick={() => remove(r.id)} className="text-destructive hover:underline">
                Удалить
              </button>
            </div>
          </li>
        ))}
      </ul>
      {adding ? (
        <div id="role-form" className="mt-4 grid scroll-mt-24 gap-3 border-t pt-4">
          {editing && <div className="font-bold">Изменить роль</div>}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {editing ? "Поправь задачи, часы и то, что человек получит." : "Поля заполнены примером для этой роли: поправь под свой проект."}
            </span>
            <button type="button" onClick={applyExample} className="ml-auto shrink-0 text-xs font-semibold text-brand-ink hover:underline">
              Подставить пример
            </button>
          </div>
          <select
            value={draft.role}
            onChange={(e) => chooseRole(e.target.value)}
            disabled={!!editing}
            aria-label="Роль"
            className="h-11 rounded-xl bg-white px-3 text-sm disabled:opacity-60"
          >
            {roles.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
          <Input placeholder="Название роли, напр. «UI/UX дизайнер»" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <Textarea
            rows={3}
            placeholder="Что делать: например, «нарисовать экраны заказа и корзины в Figma, собрать UI-кит»"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
          <Textarea
            rows={2}
            maxLength={500}
            placeholder="Что получит человек: например, «кейс в портфолио, рекомендация, оплата 15 000 ₽ в месяц»"
            value={draft.outcome}
            onChange={(e) => setDraft({ ...draft, outcome: e.target.value })}
          />
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              Мест:
              <Input type="number" min={1} max={20} className="w-20" value={draft.slots} onChange={(e) => setDraft({ ...draft, slots: Number(e.target.value) || 1 })} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              Часов в неделю:
              <Input
                type="number"
                min={1}
                max={40}
                className="w-20"
                value={draft.hours_per_week ?? ""}
                onChange={(e) => setDraft({ ...draft, hours_per_week: e.target.value ? Math.min(40, Math.max(1, Number(e.target.value))) : null })}
              />
            </label>
          </div>
          <SkillPicker all={skills} value={draft.skills} max={12} onChange={(v) => setDraft({ ...draft, skills: v })} />
          <div className="flex gap-2">
            <Button onClick={add} disabled={draft.title.trim().length < 2}>
              {editing ? "Сохранить роль" : "Добавить роль"}
            </Button>
            {startup.roles.length > 0 && (
              <Button variant="ghost" onClick={closeForm}>
                Отмена
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Button variant="outline" className="mt-4 w-full" onClick={() => setAdding(true)}>
          Добавить место
        </Button>
      )}
    </div>
  );
}

type RoleDraft = {
  role: string;
  title: string;
  description: string;
  outcome: string;
  hours_per_week: number | null;
  slots: number;
  skills: string[];
};

/**
 * Подставляет шаблон новой роли только в поля, которые основатель не менял:
 * пустые или всё ещё равные шаблону предыдущей роли. Свой текст не затирается.
 */
export function fillFromTemplate(d: RoleDraft, prev: RoleTemplateOut | undefined, next: RoleTemplateOut | undefined, terms: string): RoleDraft {
  if (!next) return d;
  const untouched = <T,>(value: T, prevValue: T | undefined) => value === "" || value === null || value === prevValue;
  return {
    ...d,
    title: untouched(d.title, prev?.title) ? next.title : d.title,
    description: untouched(d.description, prev?.description) ? next.description : d.description,
    hours_per_week: untouched(d.hours_per_week, prev?.hours_per_week) ? next.hours_per_week : d.hours_per_week,
    outcome: untouched(d.outcome, prev?.outcome[terms]) ? (next.outcome[terms] ?? "") : d.outcome,
  };
}
