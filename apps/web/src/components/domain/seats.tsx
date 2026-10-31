import { UserPlus, Users } from "lucide-react";

import { plural } from "@/lib/labels";

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "•";
}

/**
 * Состав команды одной строкой — словами, а не квадратиками: «1 в команде · ищут ещё 2».
 * Квадраты-места читались неочевидно (обратная связь с демо), поэтому в списках и карточках — текст.
 */
export function SeatRow({ filled, open }: { filled: number; open: number }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <Users aria-hidden className="size-4" />
        {filled} в команде
      </span>
      {open > 0 ? (
        <span className="inline-flex items-center gap-1.5 font-semibold text-brand-ink">
          <UserPlus aria-hidden className="size-4" />
          {plural(open, `Ищут ещё ${open} человека`, `Ищут ещё ${open} человека`, `Ищут ещё ${open} человек`)}
        </span>
      ) : (
        <span className="font-semibold text-muted-foreground">Команда собрана</span>
      )}
    </span>
  );
}
