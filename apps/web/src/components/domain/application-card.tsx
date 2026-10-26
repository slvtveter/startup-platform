"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ApplicationStatusBadge, SkillChip } from "@/components/domain/badges";
import { PersonAvatar } from "@/components/domain/person-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { acceptApplication, rejectApplication, withdrawApplication, type ApplicationOut } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { LEVEL, timeAgo } from "@/lib/labels";

const REJECT_TEMPLATES = ["Роль уже закрыта", "Нужен опыт в этой области", "Не совпадаем по времени"];

// Шаги после взаимного согласия: это реальная последовательность, поэтому с номерами.
const NEXT_STEPS = [
  "Напиши основателю в чат первым сегодня: пара фраз о себе и когда удобно созвониться.",
  "Договоритесь о коротком созвоне на 20–30 минут в ближайшие дни.",
  "Спроси, какие задачи на первую неделю и кто в команде их проверяет.",
];

const STEP_LABELS: Record<string, string> = {
  accepted: "Принят",
  rejected: "Отказ",
  withdrawn: "Отозван",
};

/** Путь отклика: отправлен → решение (при принятии сразу открываются контакты). Будущий шаг приглушён. */
function StatusTimeline({ app }: { app: ApplicationOut }) {
  const decided = app.status !== "pending";
  // Принятие и открытие контактов — одно действие, поэтому и один шаг.
  const decision =
    app.status === "accepted" ? "Принят, контакты открыты" : decided ? (STEP_LABELS[app.status] ?? "Решение") : "Ждёт решения";
  const steps = [
    { label: app.direction === "invite" ? "Приглашение" : "Отправлен", done: true, at: app.created_at },
    { label: decision, done: decided, at: app.decided_at },
  ];
  return (
    <ol className="mt-4 flex flex-col items-start gap-1.5 text-xs sm:flex-row sm:items-center sm:gap-2" aria-label="Статус заявки">
      {steps.map((step, i) => (
        <li key={step.label} className="flex items-center gap-2">
          {/* На узком экране шаги идут столбиком, и соединительная черта только мешает. */}
          {i > 0 && <span aria-hidden className={`hidden h-px w-6 sm:block ${step.done ? "bg-foreground" : "bg-border"}`} />}
          <span
            className={`rounded-full px-2.5 py-1 font-semibold ${
              step.done
                ? app.status === "rejected" && i === 1
                  ? "bg-secondary text-muted-foreground"
                  : "bg-foreground text-background"
                : "border border-dashed text-muted-foreground"
            }`}
          >
            {step.label}
            {step.done && step.at ? `, ${timeAgo(step.at)}` : ""}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function ApplicationCard({ app, perspective }: { app: ApplicationOut; perspective: "candidate" | "founder" }) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function act(kind: "accept" | "reject" | "withdraw") {
    setBusy(true);
    const path = { app_id: app.id };
    const res =
      kind === "accept"
        ? await acceptApplication({ path, body: { note: "" } })
        : kind === "reject"
          ? await rejectApplication({ path, body: { note } })
          : await withdrawApplication({ path });
    setBusy(false);
    if (res.error) return toast.error(errorMessage(res.error));
    toast.success(kind === "accept" ? "Готово! Контакты открыты обеим сторонам." : kind === "reject" ? "Отказ отправлен" : "Отклик отозван");
    setRejecting(false);
    router.refresh();
  }

  const isInvite = app.direction === "invite";
  const person = app.applicant;
  const highlight = app.can_decide ? "border-foreground border-2" : app.status === "accepted" ? "border-success-ink/40" : "";

  return (
    <article id={`app-${app.id}`} className={`scroll-mt-24 rounded-2xl border bg-card p-5 sm:p-6 ${highlight}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {perspective === "founder" && person && <PersonAvatar name={person.display_name} />}
        <div className="min-w-0 flex-1">
          <div className="text-sm text-muted-foreground">
            {perspective === "candidate" ? (
              <Link href={`/startups/${app.startup_slug}`} className="font-semibold text-foreground hover:underline">
                {app.startup_title}
              </Link>
            ) : person ? (
              <Link href={`/people/${person.slug}`} className="font-semibold text-foreground hover:underline">
                {person.display_name}
              </Link>
            ) : null}
            {", "}
            {isInvite ? (perspective === "candidate" ? "приглашение от основателя" : "вы пригласили") : "отклик"}, {timeAgo(app.created_at)}
          </div>
          <div className="mt-0.5 text-xl font-bold">{app.role_title}</div>
          {perspective === "founder" && person && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              {person.experience_level && <span className="mr-1">{LEVEL[person.experience_level]}</span>}
              {person.skills.slice(0, 5).map((s) => (
                <SkillChip key={s.slug} name={s.name} />
              ))}
            </div>
          )}
        </div>
        <ApplicationStatusBadge status={app.status} className="self-start" />
      </div>

      <StatusTimeline app={app} />

      <p className="mt-4 rounded-xl bg-secondary p-4 text-[15px] leading-relaxed whitespace-pre-line">{app.message}</p>
      {app.decision_note && <p className="mt-3 text-sm text-muted-foreground">Комментарий: {app.decision_note}</p>}

      {app.contacts && (
        <div className="mt-4 grid gap-4 rounded-xl bg-success-soft p-4 text-sm sm:grid-cols-3">
          <div>
            <div className="text-success-ink/80">{perspective === "candidate" ? "Основатель" : "Участник"}</div>
            <div className="font-bold">{app.contacts.display_name}</div>
          </div>
          {app.contacts.telegram && (
            <div>
              <div className="text-success-ink/80">Telegram</div>
              <a href={`https://t.me/${app.contacts.telegram}`} target="_blank" rel="noopener noreferrer" className="font-bold underline">
                @{app.contacts.telegram}
              </a>
            </div>
          )}
          {app.contacts.email && (
            <div>
              <div className="text-success-ink/80">Email</div>
              <a href={`mailto:${app.contacts.email}`} className="font-bold underline">
                {app.contacts.email}
              </a>
            </div>
          )}
        </div>
      )}

      {app.contacts && perspective === "candidate" && (
        <div className="mt-4 rounded-xl border p-4">
          <div className="font-semibold">Что дальше</div>
          <ol className="mt-2 grid gap-1.5 text-sm text-muted-foreground">
            {NEXT_STEPS.map((step, i) => (
              <li key={step} className="flex gap-2">
                <span className="font-semibold text-foreground">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {(app.can_decide || app.can_withdraw) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {app.can_decide && !rejecting && (
            <>
              <Button className="bg-success-ink text-primary-foreground hover:bg-success-ink/90" onClick={() => act("accept")} disabled={busy}>
                Принять
              </Button>
              <Button variant="outline" onClick={() => setRejecting(true)} disabled={busy}>
                Отклонить
              </Button>
              {perspective === "founder" && person && (
                <Link href={`/people/${person.slug}`} className="px-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                  Профиль и портфолио
                </Link>
              )}
            </>
          )}
          {rejecting && (
            <div className="grid w-full gap-2">
              <div className="flex flex-wrap gap-2">
                {REJECT_TEMPLATES.map((t) => (
                  <button key={t} type="button" onClick={() => setNote(t)} className="rounded-full border px-3 py-1 text-xs font-semibold hover:border-foreground">
                    {t}
                  </button>
                ))}
              </div>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Причина (необязательно, но вежливо)" />
              <div className="flex gap-2">
                <Button variant="destructive" onClick={() => act("reject")} disabled={busy}>
                  Отправить отказ
                </Button>
                <Button variant="ghost" onClick={() => setRejecting(false)}>
                  Отмена
                </Button>
              </div>
            </div>
          )}
          {app.can_withdraw && (
            <Button variant="ghost" onClick={() => act("withdraw")} disabled={busy}>
              Отозвать отклик
            </Button>
          )}
        </div>
      )}
      {app.status !== "withdrawn" && (
        <Link
          href={`/chats/application/${app.id}`}
          className={buttonVariants({ variant: "outline", size: "sm", className: "mt-4 w-fit" })}
        >
          <MessageCircle aria-hidden className="size-4" />
          {perspective === "founder" ? "Написать кандидату" : "Написать основателю"}
        </Link>
      )}
    </article>
  );
}
