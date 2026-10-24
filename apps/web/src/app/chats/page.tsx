import { MessagesSquare } from "lucide-react";

export default function ChatsIndex() {
  return (
    <section className="grid place-items-center p-8 text-center max-md:hidden">
      <div>
        <MessagesSquare aria-hidden className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-3 font-sans text-lg font-semibold tracking-normal">Выбери диалог</h1>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Здесь переписка с основателями и людьми, которым ты написал. Отклик открывает диалог автоматически.
        </p>
      </div>
    </section>
  );
}
