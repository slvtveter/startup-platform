import { cn } from "@/lib/utils";
import { APP_STATUS, STAGE, STARTUP_STATUS, TERMS } from "@/lib/labels";

const pill = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap";

export function TermsBadge({ terms, className }: { terms: string; className?: string }) {
  const tone = terms === "free" ? "bg-secondary text-foreground" : terms === "paid" ? "bg-success-soft text-success-ink" : "bg-warn-soft text-warn-ink";
  return <span className={cn(pill, tone, className)}>{TERMS[terms] ?? terms}</span>;
}

export function StageBadge({ stage }: { stage: string }) {
  return <span className={cn(pill, "border bg-background text-muted-foreground")}>{STAGE[stage] ?? stage}</span>;
}

export function StartupStatusBadge({ status }: { status: string }) {
  const tone =
    status === "recruiting" ? "bg-success-soft text-success-ink" : status === "draft" ? "bg-warn-soft text-warn-ink" : "bg-secondary text-muted-foreground";
  return <span className={cn(pill, tone)}>{STARTUP_STATUS[status] ?? status}</span>;
}

export function ApplicationStatusBadge({ status, className }: { status: string; className?: string }) {
  const tone =
    status === "accepted"
      ? "bg-success-soft text-success-ink"
      : status === "pending"
        ? "bg-warn-soft text-warn-ink"
        : "bg-secondary text-muted-foreground";
  return <span className={cn(pill, tone, className)}>{APP_STATUS[status] ?? status}</span>;
}

export function SkillChip({ name, highlight = false }: { name: string; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
        highlight ? "bg-brand-soft text-brand-ink" : "bg-tone text-foreground",
      )}
    >
      {name}
    </span>
  );
}

/** Демо-карточка на пустом проде (app.scripts.demo): пример, а не настоящий человек или проект. */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <span className={cn(pill, "bg-warn-soft text-warn-ink", className)} title="Пример: так выглядит карточка на платформе">
      Пример
    </span>
  );
}

export function DemoNotice({ kind }: { kind: "startup" | "person" }) {
  return (
    <p className="rounded-2xl bg-tone p-4 text-sm text-muted-foreground">
      {kind === "startup"
        ? "Это пример: так выглядит стартап на платформе. Откликнуться на него нельзя, настоящие проекты появятся совсем скоро."
        : "Это пример: так выглядит профиль на платформе. Написать или пригласить этого человека нельзя."}
    </p>
  );
}
