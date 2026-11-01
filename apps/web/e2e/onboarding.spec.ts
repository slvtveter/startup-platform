import { expect, test } from "@playwright/test";

import { register, uniqueEmail } from "./helpers";

/** Онбординг 2026-11-01: регистрация → анкета профиля → «Что дальше?» → сразу к делу. */
test("signup leads to the profile first, then to the next-step choice", async ({ page }) => {
  await register(page, uniqueEmail("onboard"));
  await expect(page).toHaveURL(/welcome=1/);
  await expect(page.getByRole("heading", { name: "Расскажи о себе" })).toBeVisible();

  await page.getByLabel("Имя или псевдоним").fill("Ника Тестова");
  await page.getByRole("button", { name: "Дизайнер", exact: true }).click();
  await page.getByRole("button", { name: "Дальше" }).click();
  await page.getByPlaceholder("Начни вводить").fill("Figma");
  await page.getByRole("button", { name: "+ Figma" }).click();
  await page.getByRole("button", { name: "Дальше" }).click();
  await page.getByRole("button", { name: /^Без оплаты/ }).click();
  await page.getByRole("button", { name: "Опубликовать и продолжить" }).click();
  const consent = page.getByRole("dialog", { name: "Согласие на публикацию профиля" });
  await consent.getByRole("checkbox").check();
  await consent.getByRole("button", { name: "Опубликовать" }).click();

  await page.waitForURL(/\/welcome$/);
  await expect(page.getByRole("heading", { name: "Профиль готов. Что дальше?" })).toBeVisible();
  await page.getByRole("button", { name: /Хочу в команду/ }).click();
  await page.waitForURL(/\/startups$/);
});
