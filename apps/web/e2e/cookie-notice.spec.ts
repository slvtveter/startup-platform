import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

/** KAN-130, KAN-132: новый посетитель выбирает, разрешить ли Метрику; после выбора плашка не возвращается. */
test("cookie notice asks once and remembers the choice", async ({ page }) => {
  await page.goto("/");
  const notice = page.getByRole("region", { name: "Cookie" });
  await expect(notice).toBeVisible();
  await notice.getByRole("link", { name: "Подробнее" }).click();
  await expect(page.getByRole("heading", { name: "Cookie и данные" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "session" })).toBeVisible();
  await expect(page.getByText("ещё не выбрано")).toBeVisible();

  await page.getByRole("region", { name: "Cookie" }).getByRole("button", { name: "Только нужные" }).click();
  await expect(notice).toBeHidden();
  await expect(page.getByText("отключена")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Cookie и данные" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Cookie" })).toBeHidden();

  // Передумал: разрешить можно на странице /cookies. На localhost счётчик всё равно не грузится.
  await page.getByRole("button", { name: "Разрешить" }).click();
  await expect(page.getByText("разрешена")).toBeVisible();
  expect(await page.evaluate(() => "ym" in window)).toBe(false);
});
