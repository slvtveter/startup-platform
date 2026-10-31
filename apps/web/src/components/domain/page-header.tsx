import { Sticker, type StickerName } from "@/components/brand/stickers";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-[32px] leading-[1.05] sm:text-[48px]">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex gap-2 sm:ml-auto">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  text,
  action,
  sticker = "spark",
}: {
  title: string;
  text?: string;
  action?: React.ReactNode;
  /** Наклейка бренда над заголовком. */
  sticker?: StickerName;
}) {
  return (
    <div className="rounded-3xl bg-tone px-6 py-14 text-center">
      <Sticker name={sticker} className="mx-auto mb-5 size-16 -rotate-6" />
      <div className="text-xl font-extrabold tracking-[-0.02em]">{title}</div>
      {text && <p className="mx-auto mt-2 max-w-md text-muted-foreground">{text}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  // cn (tailwind-merge): переданный max-w-* или py-* заменяет базовый, а не спорит с ним за порядок в CSS.
  return <div className={cn("mx-auto w-full max-w-[1360px] px-4 py-10 sm:px-6 lg:px-10", className)}>{children}</div>;
}
