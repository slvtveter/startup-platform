import { expect, test } from "@playwright/test";

import { register, uniqueEmail, verifyEmailViaMailpit } from "./helpers";

/**
 * KAN-75: админ переносит чужой открытый проект на платформу без SQL,
 * а основатель получает права, когда регистрируется и подтверждает почту.
 */
test("admin moves a startup to the platform and the founder claims it", async ({ browser }) => {
  const stamp = Date.now();
  const title = `E2E Перенос ${stamp}`;
  const founderEmail = uniqueEmail("claim");

  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  const res = await admin.request.post("/api/auth/login", { data: { email: "admin@example.com", password: "demo12345" } });
  expect(res.ok()).toBeTruthy();

  await admin.goto("/admin");
  await admin.getByLabel("Название", { exact: true }).fill(title);
  await admin.getByLabel("Email основателя").fill(founderEmail);
  await admin.getByLabel("Идея одной фразой").fill("Открытый проект, который переносим на платформу");
  await admin
    .getByLabel("Подробнее")
    .fill("Команда ведёт проект в телеграм-чате; переносим карточку, чтобы новички могли откликаться на места.");
  await admin.getByRole("button", { name: "Создать черновик" }).click();
  await admin.waitForURL(/\/edit$/);

  await admin.getByPlaceholder("Название роли").fill("Backend-разработчик");
  await admin.getByRole("button", { name: "Добавить роль" }).click();
  // Под нагрузкой ответ на добавление роли приходит не сразу: ждём, пока редактор его увидит.
  await expect(admin.getByText("Откройте хотя бы одну роль")).toHaveCount(0);
  await admin.getByRole("button", { name: "Опубликовать" }).click();
  await admin.waitForURL(/\/startups\/[^/]+$/);
  const url = new URL(admin.url()).pathname;
  await expect(admin.getByText(/Это твой (стартап|проект)/)).toBeVisible();

  // Основатель регистрируется на тот же email и подтверждает почту.
  const founderCtx = await browser.newContext();
  const founder = await founderCtx.newPage();
  await register(founder, founderEmail);
  await verifyEmailViaMailpit(founder, founderEmail);
  await founder.goto(url);
  await expect(founder.getByText(/Это твой (стартап|проект)/)).toBeVisible();

  await admin.reload();
  await expect(admin.getByText(/Это твой (стартап|проект)/)).toHaveCount(0);

  await adminCtx.close();
  await founderCtx.close();
});
