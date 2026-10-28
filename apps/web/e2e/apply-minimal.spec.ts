import { expect, test } from "@playwright/test";

import { fillRegistration, uniqueEmail } from "./helpers";

/**
 * KAN-83 (гипотезы H4, H6): гость откликается на место, ни разу не открыв /me/profile.
 * Недостающие поля профиля заполняются прямо в диалоге отклика.
 */
test("guest applies to a seat without visiting the profile page", async ({ page }) => {
  const visited: string[] = [];
  page.on("framenavigated", (f) => {
    if (f === page.mainFrame()) visited.push(new URL(f.url()).pathname);
  });

  await page.goto("/startups/vkusnoryadom");
  const seat = page.locator("#roles article").first();
  await seat.getByRole("link", { name: "Войти и откликнуться" }).click();
  await page.waitForURL(/\/login/);
  await page.getByRole("main").getByRole("link", { name: "Регистрация" }).click();
  await page.waitForURL(/\/register\?next=/);
  await expect(page.getByRole("heading", { name: "Создать аккаунт" })).toBeVisible();

  // Почта подтверждается кодом прямо при регистрации — после него сразу назад к роли.
  const email = uniqueEmail("seeker");
  await fillRegistration(page, email);
  await page.waitForURL(/\/startups\/vkusnoryadom\?apply=/);

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Как тебя зовут").fill("Пётр Новиков");
  await dialog.getByLabel("Твоя основная роль").selectOption("designer");
  await dialog.getByLabel("Ссылка на работу").fill("https://behance.net/e2e-petr");
  await dialog
    .getByLabel("Сообщение основателю")
    .fill("Учусь на дизайнера, сделал два учебных приложения. Готов уделять 8 часов в неделю.");
  await dialog.getByRole("button", { name: "Отправить отклик" }).click();

  await page.waitForURL(/\/me\/applications/);
  await expect(page.getByText("На рассмотрении").first()).toBeVisible();
  expect(visited).not.toContain("/me/profile");
});
