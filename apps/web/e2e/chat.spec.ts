import { expect, test } from "@playwright/test";

/** KAN-127: личка с профиля и доставка сообщений без перезагрузки (WebSocket). */
test("people can message each other in real time", async ({ browser }) => {
  const stamp = Date.now();
  const maria = await (await browser.newContext()).newPage();
  const alina = await (await browser.newContext()).newPage();
  await maria.request.post("/api/auth/login", { data: { email: "maria@example.com", password: "demo12345" } });
  await alina.request.post("/api/auth/login", { data: { email: "alina@example.com", password: "demo12345" } });

  const alinaSlug = (await (await alina.request.get("/api/profile/me")).json()).slug;
  await alina.goto("/chats");

  await maria.goto(`/people/${alinaSlug}`);
  await maria.getByRole("button", { name: "Написать" }).click();
  await maria.getByRole("textbox", { name: "Сообщение" }).fill(`Привет! Есть идея ${stamp}`);
  await maria.getByRole("button", { name: "Отправить" }).click();
  await maria.waitForURL(/\/chats\/[0-9a-f-]+$/);

  // У Алины диалог появился в списке без перезагрузки страницы.
  await alina.getByRole("link", { name: /Мария Ким/ }).first().click();
  await expect(alina.getByText(`Привет! Есть идея ${stamp}`).first()).toBeVisible();

  await alina.getByRole("textbox", { name: "Сообщение" }).fill(`Давай созвонимся ${stamp}`);
  await alina.keyboard.press("Enter");
  // Ответ доходит до Марии в открытом диалоге — тоже без перезагрузки.
  await expect(maria.getByText(`Давай созвонимся ${stamp}`)).toBeVisible();
});
