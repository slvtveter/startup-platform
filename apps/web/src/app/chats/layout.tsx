import { redirect } from "next/navigation";

import { ChatList } from "@/components/domain/chat/chat-list";
import { listChats } from "@/lib/api";
import { getMe, serverClient } from "@/lib/server-api";

export const metadata = { title: "Сообщения" };

/** Мессенджер: слева диалоги, справа переписка. На телефоне — по очереди. */
export default async function ChatsLayout({ children }: { children: React.ReactNode }) {
  const user = await getMe();
  if (!user) redirect("/login?next=/chats");
  const { data } = await listChats({ client: await serverClient(), query: { limit: 100 } });
  return (
    <div className="mx-auto max-w-6xl px-0 sm:px-6 sm:py-6">
      <div className="grid h-[calc(100dvh-4rem)] overflow-hidden border-y bg-card sm:h-[calc(100dvh-7rem)] sm:rounded-2xl sm:border md:grid-cols-[340px_minmax(0,1fr)]">
        <ChatList items={data?.items ?? []} />
        {children}
      </div>
    </div>
  );
}
