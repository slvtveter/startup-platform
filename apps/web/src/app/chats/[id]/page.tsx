import { notFound } from "next/navigation";

import { ChatThread } from "@/components/domain/chat/chat-thread";
import { getChat, listMessages } from "@/lib/api";
import { serverClient } from "@/lib/server-api";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await serverClient();
  const [{ data: chat }, { data: messages }] = await Promise.all([
    getChat({ client, path: { conv_id: id } }),
    listMessages({ client, path: { conv_id: id } }),
  ]);
  if (!chat) notFound();
  return <ChatThread key={id} chat={chat} initial={messages ?? []} />;
}
