import { expect, test } from "@playwright/test";

/** KAN-100: админ видит когорты и скачивает CSV; без прав выгрузка недоступна. */
test("admin downloads funnel CSV, others cannot", async ({ page, browser }) => {
  await page.request.post("/api/auth/login", { data: { email: "admin@example.com", password: "demo12345" } });
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Удержание по неделям регистрации" })).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Воронка в CSV" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^funnel-\d{4}-\d{2}-\d{2}\.csv$/);

  const guest = await browser.newContext();
  expect((await guest.request.get("/api/admin/export?kind=funnel")).status()).toBe(401);
  await guest.close();
});
