import { expect, test } from "@playwright/test";

/** KAN-98: выбор роли заполняет пустые поля примером и не трогает введённый текст. */
test("role template prefills empty fields and keeps founder's text", async ({ page }) => {
  const res = await page.request.post("/api/auth/login", { data: { email: "alina@example.com", password: "demo12345" } });
  expect(res.ok()).toBeTruthy();
  await page.goto("/startups/vkusnoryadom/edit");
  await page.getByRole("button", { name: "Добавить место" }).click();

  const title = page.getByPlaceholder("Название роли");
  const tasks = page.getByPlaceholder(/Что делать/);
  await page.getByLabel("Роль").selectOption("designer");
  await expect(title).toHaveValue("UI/UX дизайнер");
  await expect(tasks).toHaveValue(/Figma/);

  // Своё описание задач остаётся, а название (не трогали) меняется под новую роль.
  await tasks.fill("Свои задачи основателя");
  await page.getByLabel("Роль").selectOption("backend");
  await expect(title).toHaveValue("Backend-разработчик");
  await expect(tasks).toHaveValue("Свои задачи основателя");

  await page.getByRole("button", { name: "Подставить пример" }).click();
  await expect(tasks).toHaveValue(/API/);
});
