import { expect, test } from "@playwright/test";

import { uniqueEmail, registerViaApi } from "./helpers";

const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";

/** KAN-74: ссылка отписки из настоящего письма работает без входа. */
test("founder unsubscribes from application emails via the link in the email", async ({ page, browser }) => {
  // Новичок откликается на место во «ВкусноРядом» — письмо уходит основателю через очередь.
  const email = uniqueEmail("unsub");
  const api = page.request;
  await registerViaApi(page, email);
  await api.patch("/api/profile/me", {
    data: { display_name: "Тест Отписки", primary_role: "designer", links: [{ kind: "portfolio", url: "https://example.com/e2e" }] },
  });
  const startup = await (await api.get("/api/startups/vkusnoryadom")).json();
  const role = startup.roles.find((r: { is_open: boolean }) => r.is_open);
  const sent = await api.post(`/api/startup-roles/${role.id}/applications`, {
    data: { message: "Проверяю отписку от писем: этот отклик создан автотестом." },
  });
  expect(sent.ok()).toBeTruthy();

  let link = "";
  await expect
    .poll(
      async () => {
        const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent('to:"alina@example.com" Тест Отписки')}`);
        const { messages = [] } = (await res.json()) as { messages?: { ID: string }[] };
        if (!messages.length) return "";
        const msg = (await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json()) as { Text: string };
        link = /(https?:\/\/\S+\/unsubscribe\?\S+)/.exec(msg.Text)?.[1] ?? "";
        return link;
      },
      { timeout: 30_000 },
    )
    .not.toBe("");

  // Открываем ссылку в чистом браузере, без входа.
  const guest = await (await browser.newContext()).newPage();
  const url = new URL(link);
  await guest.goto(url.pathname + url.search);
  await guest.getByRole("button", { name: "Отписаться" }).click();
  await expect(guest.getByRole("heading", { name: "Готово, больше не пришлём" })).toBeVisible();

  // Возвращаем демо-аккаунту настройки, чтобы не влиять на другие проверки.
  const alina = await (await browser.newContext()).request;
  await alina.post("/api/auth/login", { data: { email: "alina@example.com", password: "demo12345" } });
  const prefs = await (await alina.get("/api/me/email-prefs")).json();
  expect(prefs.find((p: { kind: string }) => p.kind === "applications").enabled).toBe(false);
  await alina.put("/api/me/email-prefs", { data: { prefs: { applications: true } } });
});
