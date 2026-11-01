import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { listRoles, me } from "@/lib/api";
import { createClient, createConfig } from "@/lib/api/client";

// Server Components ходят в FastAPI напрямую (внутри docker-сети),
// браузер — через Caddy по относительному пути /api.
const API_URL = process.env.API_INTERNAL_URL ?? "http://localhost:8000";

/** Клиент на один запрос: прокидывает cookie сессии пользователя в API. */
export async function serverClient() {
  const store = await cookies();
  const cookie = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  return createClient(createConfig({ baseUrl: API_URL, headers: cookie ? { cookie } : {} }));
}

/** Анонимный клиент без cookie: для публичных данных (OG-картинки, sitemap). */
export function publicClient() {
  return createClient(createConfig({ baseUrl: API_URL }));
}

/** Текущий пользователь или null. cache() — один запрос к API на рендер страницы. */
export const getMe = cache(async () => {
  const { data } = await me({ client: await serverClient() });
  return data ?? null;
});

/** Для закрытых страниц: без входа уводим на /login и возвращаем обратно после. */
/** signup — гостя ведём на регистрацию, а не на вход (действие для новичка: «Добавить проект»). */
export async function requireMe(next: string, { signup = false }: { signup?: boolean } = {}) {
  const user = await getMe();
  if (!user) redirect(`/${signup ? "register" : "login"}?next=${encodeURIComponent(next)}`);
  return user;
}

/** Справочник ролей: публичный, один запрос на рендер, даже если он нужен и метаданным, и странице. */
export const getRoles = cache(async () => {
  const { data } = await listRoles({ client: publicClient() });
  return data ?? [];
});
