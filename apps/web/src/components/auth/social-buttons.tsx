import { buttonVariants } from "@/components/ui/button";
import { socialProviders } from "@/lib/api";
import { serverClient } from "@/lib/server-api";

/**
 * Вход через Telegram и VK ID. Кнопки появляются, только когда на сервере заданы токен бота
 * и client_id приложения. Обе — обычные ссылки: никаких внешних скриптов на странице (AGENTS.md, п. 7).
 */
export async function SocialButtons() {
  const { data } = await socialProviders({ client: await serverClient() });
  if (!data || (!data.telegram && !data.vk)) return null;
  const site = process.env.SITE_URL ?? "http://localhost:8080";
  const tg =
    data.telegram && data.telegram_bot_id
      ? `https://oauth.telegram.org/auth?${new URLSearchParams({
          bot_id: data.telegram_bot_id,
          origin: site,
          request_access: "write",
          return_to: `${site}/auth/telegram`,
        })}`
      : null;
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        или
        <span className="h-px flex-1 bg-border" />
      </div>
      {tg && (
        <a href={tg} className={buttonVariants({ variant: "outline", size: "lg", className: "w-full" })}>
          Войти через Telegram
        </a>
      )}
      {data.vk && (
        <a href="/api/auth/vk/start" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full" })}>
          Войти через VK ID
        </a>
      )}
    </div>
  );
}
