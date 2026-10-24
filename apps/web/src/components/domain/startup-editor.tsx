"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Seat, SeatRow } from "@/components/domain/seats";
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
  publishStartup,
  updateStartup,
  updateStartupRole,
  type RoleOut,
  type SkillOut,
  type Stage,
  type StartupDetail,
  type Terms,
} from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { STAGE, TERMS, TERMS_HINT } from "@/lib/labels";
import { cn } from "@/lib/utils";

type Base = {
  title: string;
  pitch: string;
  description: string;
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
    stage: startup?.stage ?? "idea",
    terms: startup?.terms ?? "equity",
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
      <form onSubmit={save} className="grid gap-6 rounded-3xl border bg-card p-6 sm:p-8">
        <div>
          <Label htmlFor="title">Название</Label>
          <Input id="title" required minLength={2} maxLength={80} className="mt-1.5 h-11" value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="pitch">Идея одной фразой</Label>
          <Input id="pitch" maxLength={160} placeholder="Домашняя еда от соседей с доставкой за 30 минут" className="mt-1.5 h-11" value={form.pitch} onChange={(e) => set("pitch", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="description">Подробнее</Label>
          <Textarea
            id="description"
            rows={7}
            className="mt-1.5"
            placeholder="Какую проблему решаете, что уже сделано, какие планы на ближайшие 2–3 месяца"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">{form.description.length} символов, для публикации нужно от 50</p>
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
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
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
            placeholder="Детали: размер доли и вестинг, оплата, сколько часов в неделю, как часто созвоны"
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

  async function add() {
    const { error } = await addStartupRole({ path: { startup_id: startup.id }, body: draft });
    if (error) return toast.error(errorMessage(error));
    setDraft(empty);
    setAdding(false);
    router.refresh();
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
    <div className="rounded-2xl border bg-card p-5">
      <div className="font-bold">Места в команде</div>
      <p className="mt-1 text-sm text-muted-foreground">
        Чем конкретнее задачи, часы и то, что человек получит, тем больше откликов.
      </p>
      <div className="mt-4 rounded-xl bg-secondary p-3">
        <div className="text-xs text-muted-foreground">Так команду увидят новички</div>
        <div className="mt-2 flex items-center gap-3">
          <SeatRow
            filled={startup.team.length}
            open={startup.roles.filter((r) => r.is_open).reduce((n, r) => n + Math.max(0, (r.slots ?? 1) - (r.filled ?? 0)), 0)}
            size="md"
          />
        </div>
      </div>
      <ul className="mt-3 grid gap-2">
        {startup.roles.map((r) => (
          <li key={r.id} className="rounded-xl border p-3">
            <div className="flex items-start gap-2">
              <Seat filled={!r.is_open} size="sm" className="mt-0.5" />
              <div className="min-w-0">
                <div className="truncate font-bold">{r.title}</div>
                <div className="text-xs text-muted-foreground">
                  {[r.role.name, `мест: ${r.slots ?? 1}`, r.hours_per_week ? `${r.hours_per_week} ч в неделю` : null, r.is_open ? "открыта" : "закрыта"]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </div>
            </div>
            <div className="mt-2 flex gap-3 text-xs font-semibold">
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
        <div className="mt-4 grid gap-3 border-t pt-4">
          <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} className="h-10 rounded-lg border bg-card px-3 text-sm">
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
            placeholder="Что получит человек: например, «кейс в портфолио, рекомендация, доля 0,5% после MVP»"
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
              Добавить роль
            </Button>
            {startup.roles.length > 0 && (
              <Button variant="ghost" onClick={() => setAdding(false)}>
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
