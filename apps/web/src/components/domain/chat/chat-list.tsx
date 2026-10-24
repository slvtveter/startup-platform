"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Avatar } from "@/components/domain/avatar-upload";
import type { ConversationOut } from "@/lib/api";
import { timeAgo } from "@/lib/labels";
import { useChatSocket } from "@/lib/use-chat-socket";
import { cn } from "@/lib/utils";

/** Список диалогов: свежие сверху, непрочитанные — жирным и со счётчиком. */
export function ChatList({ items }: { items: ConversationOut[] }) {
  const router = useRouter();
  const pathname = usePathname();
  // Новое сообщение в любом диалоге или переподключение: перечитываем список.
  useChatSocket((e) => {
    if (e.type === "message" || e.reconnect) router.refresh();
  });
  const openId = pathname.split("/")[2];

  return (
    <aside
      className={cn(
        "min-h-0 overflow-y-auto border-r max-md:border-r-0",
        openId && openId !== "application" ? "max-md:hidden" : "",
      )}
      aria-label="Диалоги"
    >
      {items.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          Пока нет диалогов. Откликнись на роль или напиши человеку из раздела «Люди».
        </p>
      ) : (
        <ul>
          {items.map((c) => {
            const active = c.id === openId;
            const last = c.last_message;
            const preview = last ? (last.application ? `Отклик: ${last.application.role_title}` : last.body) : "";
            return (
              <li key={c.id}>
                <Link
                  href={`/chats/${c.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn("flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary", active && "bg-secondary")}
                >
                  <Avatar name={c.peer.display_name} url={c.peer.avatar_url} className="size-11 rounded-full text-sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className={cn("truncate", c.unread ? "font-bold" : "font-semibold")}>{c.peer.display_name}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{timeAgo(c.last_message_at)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={cn("truncate text-sm", c.unread ? "text-foreground" : "text-muted-foreground")}>
                        {last?.mine ? "Вы: " : ""}
                        {preview}
                      </span>
                      {c.unread > 0 && (
                        <span className="ml-auto shrink-0 rounded-full bg-brand px-1.5 text-xs font-semibold text-white">{c.unread}</span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
