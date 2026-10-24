import { notFound, redirect } from "next/navigation";

import { chatForApplication } from "@/lib/api";
import { serverClient } from "@/lib/server-api";

/** Кнопка «Открыть чат» в карточке отклика ведёт сюда: находим диалог пары и переходим в него. */
export default async function ChatForApplication({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await chatForApplication({ client: await serverClient(), path: { app_id: id } });
  if (!data) notFound();
  redirect(`/chats/${data.id}`);
}
