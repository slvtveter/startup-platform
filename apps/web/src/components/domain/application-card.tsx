"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ApplicationStatusBadge, SkillChip } from "@/components/domain/badges";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { acceptApplication, rejectApplication, withdrawApplication, type ApplicationOut } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { LEVEL, initials, timeAgo } from "@/lib/labels";
import { cn } from "@/lib/utils";

const REJECT_TEMPLATES = ["Роль уже закрыта", "Нужен опыт в этой области", "Не совпадаем по времени"];

// Шаги после взаимного согласия: это реальная последовательность, поэтому с номерами.
const NEXT_STEPS = [
  "Напиши основателю в чат первым сегодня: пара фраз о себе и когда удобно созвониться.",
  "Договоритесь о коротком созвоне на 20–30 минут в ближайшие дни.",
  "Спроси, какие задачи на первую неделю и кто в команде их проверяет.",
];

/** Строка контекста: на какую роль и когда; после решения — когда ответили. */
function contextLine(app: ApplicationOut, perspective: "candidate" | "founder") {
  const invite = app.direction === "invite";
  const lead =
    perspective === "founder" ? (invite ? "Ты пригласил на роль" : "Откликается на роль") : invite ? "Тебя зовут на роль" : "Твой отклик на роль";
  const decided = app.decided_at ? `, ответ ${timeAgo(app.decided_at)}` : "";
  return { lead, when: `${timeAgo(app.created_at)}${decided}` };
}

/** Фото человека или инициалы на мягком фоне. */
function Face({ name, url }: { name: string; url?: string | null }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- аватары уже пережаты api в WebP
    <img src={url} alt="" loading="lazy" decoding="async" className="size-14 shrink-0 rounded-2xl bg-tone-2 object-cover" />
  ) : (
    <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-soft text-lg font-extrabold text-brand-ink">
      {initials(name)}
    </span>
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
    toast.success(kind === "accept" ? "Отклик принят" : kind === "reject" ? "Отказ отправлен" : "Отклик отозван");
    setRejecting(false);
    router.refresh();
  }

  const [expanded, setExpanded] = useState(false);
  const person = perspective === "founder" ? app.applicant : null;
  const meta = person
    ? [person.primary_role?.name, person.experience_level && LEVEL[person.experience_level], person.city].filter(Boolean).join(" · ")
    : "";
  const skills = person?.skills.slice(0, 5) ?? [];
  const moreSkills = (person?.skills.length ?? 0) - skills.length;
  // «Показать целиком» — только если текст реально не влез в три строки (на телефоне это раньше, чем на десктопе).
  const messageRef = useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  useEffect(() => {
    const el = messageRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const ctx = contextLine(app, perspective);

  return (
    <article id={`app-${app.id}`} className={cn("scroll-mt-24 rounded-3xl border bg-card p-5 sm:p-6", app.can_decide && "border-foreground/25")}>
      {/* Шапка как у записи в CRM: лицо, имя, одна строка о человеке, статус справа. */}
      <div className="flex items-start gap-4">
        {person && <Face name={person.display_name} url={person.avatar_url ?? person.avatar_url_lg} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <h2 className="line-clamp-2 min-w-0 flex-1 text-lg leading-7 font-bold tracking-[-0.02em] break-words">
              {person ? (
                <Link href={`/people/${person.slug}`} className="hover:text-brand-ink">
                  {person.display_name}
                </Link>
              ) : (
                <Link href={`/startups/${app.startup_slug}`} className="hover:text-brand-ink">
                  {app.startup_title}
                </Link>
              )}
            </h2>
            <ApplicationStatusBadge status={app.status} className="mt-0.5 shrink-0" />
          </div>
          {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {ctx.lead} <span className="font-bold text-foreground">{app.role_title}</span> · {ctx.when}
      </p>
      <blockquote className="mt-2 border-l-2 border-cornflower pl-4 text-base leading-relaxed">
        <span ref={messageRef} className={cn("whitespace-pre-line wrap-anywhere", !expanded && "line-clamp-3")}>
          {app.message}
        </span>
        {(overflowing || expanded) && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            className="mt-1 block text-sm font-bold text-brand-ink hover:underline"
          >
            {expanded ? "Свернуть" : "Показать целиком"}
          </button>
        )}
      </blockquote>
      {skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <SkillChip key={s.slug} name={s.name} />
          ))}
          {moreSkills > 0 && <SkillChip name={`+${moreSkills}`} />}
        </div>
      )}
      {app.decision_note && <p className="mt-3 text-sm text-muted-foreground">Комментарий: {app.decision_note}</p>}

      {app.contacts && (
        <div className="ym-hide-content mt-4 grid gap-4 rounded-xl bg-success-soft p-4 text-sm sm:grid-cols-3">
          <div>
            <div className="text-success-ink">{perspective === "candidate" ? "Основатель" : "Участник"}</div>
            <div className="font-bold">{app.contacts.display_name}</div>
          </div>
          {app.contacts.telegram && (
            <div>
              <div className="text-success-ink">Telegram</div>
              <a
                href={`https://t.me/${app.contacts.telegram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center font-bold underline"
              >
                @{app.contacts.telegram}
              </a>
            </div>
          )}
          {app.contacts.email && (
            <div>
              <div className="text-success-ink">Email</div>
              <a href={`mailto:${app.contacts.email}`} className="inline-flex min-h-8 items-center font-bold underline">
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

      {/* Одна строка действий: решение слева, переписка справа. Во время отказа — только форма отказа. */}
      {rejecting ? (
        <div className="mt-5 grid gap-2">
          <div className="flex flex-wrap gap-2">
            {REJECT_TEMPLATES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNote(t)}
                className="rounded-full border px-3 py-1 text-xs font-semibold hover:border-foreground"
              >
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
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {app.can_decide && (
            <>
              <Button variant="brand" onClick={() => act("accept")} disabled={busy}>
                Принять
              </Button>
              <Button variant="outline" onClick={() => setRejecting(true)} disabled={busy}>
                Отклонить
              </Button>
            </>
          )}
          {app.can_withdraw && (
            <Button variant="outline" onClick={() => act("withdraw")} disabled={busy}>
              {app.direction === "invite" ? "Отозвать приглашение" : "Отозвать отклик"}
            </Button>
          )}
          {app.status !== "withdrawn" && (
            <Link
              href={`/chats/application/${app.id}`}
              className={buttonVariants({
                variant: "ghost",
                className: "sm:ml-auto",
              })}
            >
              <MessageCircle aria-hidden />
              {perspective === "founder" ? "Написать кандидату" : "Написать основателю"}
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
