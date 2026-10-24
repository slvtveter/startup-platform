import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

/** KAN-130: новый посетитель видит плашку, после «Понятно» она не возвращается. */
test("cookie notice shows once and stays dismissed", async ({ page }) => {
  await page.goto("/");
  const notice = page.getByRole("region", { name: "Cookie" });
  await expect(notice).toBeVisible();
  await notice.getByRole("link", { name: "Подробнее" }).click();
  await expect(page.getByRole("heading", { name: "Cookie и данные" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "session" })).toBeVisible();

  await page.getByRole("region", { name: "Cookie" }).getByRole("button", { name: "Понятно" }).click();
  await expect(notice).toBeHidden();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Cookie и данные" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Cookie" })).toBeHidden();
});
