/** Счётчик новых событий у пункта меню (KAN-101). Число видно глазами, а скринридер читает фразу. */
export function InboxBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 align-middle text-[11px] font-bold text-primary-foreground">
      <span aria-hidden>{count > 99 ? "99+" : count}</span>
      <span className="sr-only">, новых: {count}</span>
    </span>
  );
}
