import { cn } from "@/lib/utils";

/**
 * «Место в команде» — главная единица интерфейса (docs/ux/design-system.md).
 * Занятое место — чернильный квадрат с инициалами, свободное — маркерный пунктир.
 */
export function Seat({
  filled,
  initials,
  size = "md",
  className,
}: {
  filled: boolean;
  initials?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = { sm: "size-6 rounded-[6px] text-[10px]", md: "size-8 rounded-lg text-xs", lg: "size-11 rounded-xl text-sm" }[size];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-bold",
        dims,
        filled ? "bg-foreground text-background" : "border-[1.5px] border-dashed border-foreground/70 bg-marker",
        className,
      )}
    >
      {filled ? initials : null}
    </span>
  );
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "•";
}

/** Состав команды одной строкой: сколько мест занято и сколько свободно. */
export function SeatRow({
  filled,
  open,
  size = "sm",
  max = 7,
}: {
  filled: number;
  open: number;
  size?: "sm" | "md";
  max?: number;
}) {
  const shownFilled = Math.min(filled, Math.max(1, max - open));
  const shownOpen = Math.min(open, max - shownFilled);
  const hidden = filled + open - shownFilled - shownOpen;
  const label = `В команде ${filled}, свободных мест ${open}`;
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={label} title={label}>
      {Array.from({ length: shownFilled }, (_, i) => (
        <Seat key={`f${i}`} filled size={size} />
      ))}
      {Array.from({ length: shownOpen }, (_, i) => (
        <Seat key={`o${i}`} filled={false} size={size} />
      ))}
      {hidden > 0 && <span className="ml-1 text-xs font-semibold text-muted-foreground">+{hidden}</span>}
    </span>
  );
}
