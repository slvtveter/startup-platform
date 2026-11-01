import { expect, test } from "@playwright/test";

/** Админка: обзор с аналитикой, вкладки со скелетоном; CSV по API — только админу (KAN-100). */
test("admin sees the overview and exports CSV, others cannot", async ({ page, browser }) => {
  await page.request.post("/api/auth/login", { data: { email: "admin@example.com", password: "demo12345" } });
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Регистрации по дням" })).toBeVisible();
  await page.getByRole("link", { name: "Пользователи" }).click();
  await page.getByRole("link", { name: "Демо", exact: true }).click();
  await expect(page).toHaveURL(/kind=demo/);
  await expect(page.getByText(/^\d+ аккаунт/)).toBeVisible();

  const csv = await page.request.get("/api/admin/export?kind=funnel");
  expect(csv.ok()).toBeTruthy();
  expect(csv.headers()["content-disposition"]).toMatch(/funnel-\d{4}-\d{2}-\d{2}\.csv/);

  const guest = await browser.newContext();
  expect((await guest.request.get("/api/admin/export?kind=funnel")).status()).toBe(401);
  await guest.close();
});
