import { cn } from "@/lib/utils";
import { APP_STATUS, STAGE, STARTUP_STATUS, TERMS } from "@/lib/labels";

const pill = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap";

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

export function ApplicationStatusBadge({ status }: { status: string }) {
  const tone =
    status === "accepted"
      ? "bg-success-soft text-success-ink"
      : status === "pending"
        ? "bg-warn-soft text-warn-ink"
        : "bg-secondary text-muted-foreground";
  return <span className={cn(pill, tone)}>{APP_STATUS[status] ?? status}</span>;
}

export function SkillChip({ name, highlight = false }: { name: string; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        highlight ? "bg-brand-soft text-brand-ink" : "bg-secondary text-foreground",
      )}
    >
      {name}
    </span>
  );
}
