"use client";

import { ArrowLeft, Briefcase, SendHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/domain/avatar-upload";
import { Button } from "@/components/ui/button";
import { type ConversationOut, type MessageOut, listMessages, readChat, sendMessage } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useChatSocket } from "@/lib/use-chat-socket";
import { cn } from "@/lib/utils";

const STATUS: Record<string, string> = {
  pending: "Ждёт решения",
  accepted: "Принят",
  rejected: "Отклонён",
  withdrawn: "Отозван",
};

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return "Сегодня";
  if (d.toDateString() === yesterday.toDateString()) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function time(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

/** Отклик или приглашение — карточкой роли, а под ней сопроводительное письмо. */
function ApplicationMessage({ m }: { m: MessageOut }) {
  const a = m.application!;
  return (
    <div className={cn("w-full max-w-md overflow-hidden rounded-2xl border bg-background", m.mine ? "ml-auto" : "")}>
      <div className="flex items-center gap-3 border-b bg-secondary/60 px-4 py-3">
        <Briefcase aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 text-sm">
          <div className="font-semibold">
            {a.direction === "invite" ? "Приглашение" : "Отклик"} на роль «{a.role_title}»
          </div>
          <Link href={`/startups/${a.startup_slug}`} className="text-muted-foreground hover:underline">
            {a.startup_title}
          </Link>
        </div>
        <span className="ml-auto shrink-0 rounded-full bg-background px-2 py-0.5 text-xs font-semibold">{STATUS[a.status] ?? a.status}</span>
      </div>
      <p className="px-4 py-3 text-[15px] whitespace-pre-line">{m.body}</p>
      <div className="px-4 pb-2 text-right text-xs text-muted-foreground">{time(m.created_at)}</div>
    </div>
  );
}

export function ChatThread({ chat, initial }: { chat: ConversationOut; initial: MessageOut[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLLIElement>(null);
  const peer = chat.peer;

  const reload = useCallback(async () => {
    const { data } = await listMessages({ path: { conv_id: chat.id } });
    if (data) setMessages(data);
    await readChat({ path: { conv_id: chat.id } });
  }, [chat.id]);

  // Открыл диалог — прочитал: счётчики в списке и в шапке обнуляются.
  useEffect(() => {
    void readChat({ path: { conv_id: chat.id } }).then(() => router.refresh());
  }, [chat.id, router]);

  useChatSocket(
    useCallback(
      (e) => {
        if (e.type === "connected" || e.conversation_id === chat.id) void reload();
      },
      [chat.id, reload],
    ),
  );

  useLayoutEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const { data, error } = await sendMessage({ path: { conv_id: chat.id }, body: { body } });
    setSending(false);
    if (error) return toast.error(errorMessage(error));
    setText("");
    setMessages((m) => (m.some((x) => x.id === data!.id) ? m : [...m, data!]));
  }

  return (
    <section className="flex min-h-0 flex-col" aria-label={`Диалог: ${peer.display_name}`}>
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Link href="/chats" className="-ml-1 rounded-lg p-1 hover:bg-secondary md:hidden" aria-label="Все диалоги">
          <ArrowLeft className="size-5" />
        </Link>
        <Avatar name={peer.display_name} url={peer.avatar_url} className="size-10 rounded-full text-sm" />
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold tracking-normal">{peer.display_name}</h1>
          {chat.context ? (
            <Link href={`/startups/${chat.context.startup_slug}`} className="block truncate text-xs text-brand-ink hover:underline">
              {chat.context.direction === "invite" ? "Приглашение" : "Отклик"}: {chat.context.role_title} в «{chat.context.startup_title}»
            </Link>
          ) : (
            peer.headline && <p className="truncate text-xs text-muted-foreground">{peer.headline}</p>
          )}
        </div>
        {peer.slug && (
          <Link href={`/people/${peer.slug}`} className="ml-auto shrink-0 text-sm font-semibold text-brand-ink hover:underline">
            Профиль
          </Link>
        )}
      </header>

      <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-secondary/30 px-4 py-4" aria-live="polite">
        {messages.map((m, i) => {
          const newDay = i === 0 || dayLabel(messages[i - 1].created_at) !== dayLabel(m.created_at);
          return (
            <li key={m.id}>
              {newDay && (
                <div className="my-3 text-center text-xs font-semibold text-muted-foreground">{dayLabel(m.created_at)}</div>
              )}
              {m.application ? (
                <ApplicationMessage m={m} />
              ) : (
                <div className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3.5 py-2 text-[15px] whitespace-pre-line",
                      m.mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md border bg-background",
                    )}
                  >
                    {m.body}
                    <span className={cn("ml-2 align-bottom text-[11px]", m.mine ? "text-white/90" : "text-muted-foreground")}>
                      {time(m.created_at)}
                    </span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
        <li ref={bottom} aria-hidden />
      </ol>

      <form
        className="flex items-end gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Сообщение
        </label>
        <textarea
          id="chat-input"
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Сообщение"
          maxLength={4000}
          className="max-h-40 min-h-11 flex-1 resize-none rounded-xl border bg-background px-3.5 py-2.5 text-[15px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button type="submit" variant="brand" size="icon" className="size-11 shrink-0" disabled={!text.trim() || sending} aria-label="Отправить">
          <SendHorizontal className="size-5" />
        </Button>
      </form>
    </section>
  );
}
